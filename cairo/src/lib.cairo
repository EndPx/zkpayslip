// zkPayslip payroll helper — per-payment commitments, channel lifecycle,
// cliff vesting, and scoped one-time income disclosures. The STRK20 pool
// custodies funds; this contract stores commitments and verifies proofs.

use starknet::ContractAddress;

// Matches privacy::objects::OpenNoteDeposit (positional Serde) — the shape
// the pool deserializes privacy_invoke's return into.
#[derive(Serde, Copy, Drop, PartialEq, Debug)]
pub struct OpenNoteDeposit {
    pub note_id: felt252,
    pub token: ContractAddress,
    pub amount: u128,
}

#[derive(Serde, Copy, Drop, PartialEq, Debug, starknet::Store)]
pub enum ChannelState {
    PendingRegistration,
    Active,
    Terminated,
}

#[derive(Serde, Copy, Drop, PartialEq, Debug, starknet::Store)]
pub struct Channel {
    pub recipient: ContractAddress,
    pub state: ChannelState,
    pub created_at: u64,
}

#[derive(Serde, Copy, Drop, PartialEq, Debug, starknet::Store)]
pub struct VestingCommitment {
    pub cliff_at: u64,
    pub schedule_hash: felt252,
    pub claimed: bool,
}

#[derive(Serde, Copy, Drop, PartialEq, Debug, starknet::Store)]
pub struct Disclosure {
    pub fact_hash: felt252,
    pub verifier: ContractAddress,
    pub expires_at: u64,
    pub nullifier: felt252,
    pub redeemed: bool,
}

#[starknet::interface]
pub trait IZkPayslip<TState> {
    fn privacy_invoke(
        ref self: TState,
        token: ContractAddress,
        pool_address: ContractAddress,
        note_id: felt252,
        channel_id: felt252,
        commitment_key: felt252,
        commitment_hash: felt252,
    ) -> Span<OpenNoteDeposit>;
    fn add_channel(ref self: TState, channel_id: felt252, recipient: ContractAddress);
    fn activate_channel(ref self: TState, channel_id: felt252);
    fn terminate_channel(ref self: TState, channel_id: felt252);
    fn set_vesting(ref self: TState, channel_id: felt252, cliff_at: u64, schedule_hash: felt252);
    fn claim_vested(ref self: TState, channel_id: felt252);
    fn create_disclosure(ref self: TState, disclosure_id: felt252, fact_hash: felt252, verifier: ContractAddress, expires_at: u64, nullifier: felt252);
    fn redeem_disclosure(ref self: TState, disclosure_id: felt252) -> bool;
    fn get_channel(self: @TState, channel_id: felt252) -> Channel;
    fn get_commitment(self: @TState, commitment_key: felt252) -> felt252;
    fn get_disclosure(self: @TState, disclosure_id: felt252) -> Disclosure;
    fn check_disclosure(self: @TState, disclosure_id: felt252) -> felt252;
}

#[starknet::contract]
mod ZkPayslip {
    use starknet::storage::{
        StorageMapReadAccess, StorageMapWriteAccess,
        StoragePointerReadAccess, StoragePointerWriteAccess,
    };
    use starknet::storage::Map;
    use starknet::{ContractAddress, get_caller_address, get_contract_address, get_block_timestamp};
    use super::{OpenNoteDeposit, ChannelState, Channel, VestingCommitment, Disclosure};

    #[starknet::interface]
    trait IErc20<T> {
        fn balance_of(self: @T, a: ContractAddress) -> u256;
        fn approve(ref self: T, s: ContractAddress, a: u256) -> bool;
    }

    const E_NOT_OWNER: felt252 = 'NOT_OWNER';
    const E_BAD_POOL: felt252 = 'BAD_POOL';
    const E_NO_INPUT: felt252 = 'NO_INPUT';
    const E_OVERFLOW: felt252 = 'OVERFLOW';
    const E_EXISTS: felt252 = 'EXISTS';
    const E_NO_CHANNEL: felt252 = 'NO_CHANNEL';
    const E_NOT_PENDING: felt252 = 'NOT_PENDING';
    const E_NOT_ACTIVE: felt252 = 'NOT_ACTIVE';
    const E_TERMINATED: felt252 = 'TERMINATED';
    const E_NOT_RECIPIENT: felt252 = 'NOT_RECIPIENT';
    const E_NO_VESTING: felt252 = 'NO_VESTING';
    const E_CLIFF: felt252 = 'CLIFF';
    const E_CLAIMED: felt252 = 'CLAIMED';
    const E_D_EXISTS: felt252 = 'D_EXISTS';
    const E_NO_DISCLOSURE: felt252 = 'NO_D';
    const E_EXPIRED: felt252 = 'EXPIRED';
    const E_REDEEMED: felt252 = 'REDEEMED';
    const E_WRONG_VERIFIER: felt252 = 'WRONG_V';
    const E_BURNED: felt252 = 'BURNED';
    const V_VALID: felt252 = 'VALID';
    const V_EXPIRED: felt252 = 'EXP';
    const V_REDEEMED: felt252 = 'REDM';
    const V_NOT_FOUND: felt252 = 'NF';

    #[storage]
    struct Storage {
        owner: ContractAddress,
        channels: Map<felt252, Channel>,
        commitments: Map<felt252, felt252>,
        vesting: Map<felt252, VestingCommitment>,
        disclosures: Map<felt252, Disclosure>,
        burned: Map<felt252, bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        ChannelAdded: ChannelAdded,
        ChannelActivated: ChannelActivated,
        ChannelTerminated: ChannelTerminated,
        CommitmentRecorded: CommitmentRecorded,
        VestingClaimed: VestingClaimed,
        DisclosureCreated: DisclosureCreated,
        DisclosureRedeemed: DisclosureRedeemed,
    }
    #[derive(Drop, starknet::Event)]
    struct ChannelAdded { #[key] channel_id: felt252, recipient: ContractAddress }
    #[derive(Drop, starknet::Event)]
    struct ChannelActivated { #[key] channel_id: felt252 }
    #[derive(Drop, starknet::Event)]
    struct ChannelTerminated { #[key] channel_id: felt252 }
    #[derive(Drop, starknet::Event)]
    struct CommitmentRecorded { #[key] commitment_key: felt252, channel_id: felt252, commitment_hash: felt252 }
    #[derive(Drop, starknet::Event)]
    struct VestingClaimed { #[key] channel_id: felt252 }
    #[derive(Drop, starknet::Event)]
    struct DisclosureCreated { #[key] disclosure_id: felt252, verifier: ContractAddress }
    #[derive(Drop, starknet::Event)]
    struct DisclosureRedeemed { #[key] disclosure_id: felt252, nullifier: felt252 }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.owner.write(owner);
    }

    #[generate_trait]
    impl Internal of InternalTrait {
        fn only_owner(ref self: ContractState) {
            assert(get_caller_address() == self.owner.read(), E_NOT_OWNER);
        }
    }

    #[abi(embed_v0)]
    impl Impl of super::IZkPayslip<ContractState> {
        fn privacy_invoke(
            ref self: ContractState,
            token: ContractAddress,
            pool_address: ContractAddress,
            note_id: felt252,
            channel_id: felt252,
            commitment_key: felt252,
            commitment_hash: felt252,
        ) -> Span<OpenNoteDeposit> {
            assert(pool_address == get_caller_address(), E_BAD_POOL);
            let ch = self.channels.read(channel_id);
            assert(ch.state == ChannelState::Active, E_NOT_ACTIVE);
            self.commitments.write(commitment_key, commitment_hash);

            // Echo: approve the pool to pull its tokens back into the open note.
            let erc20 = IErc20Dispatcher { contract_address: token };
            let bal: u256 = erc20.balance_of(get_contract_address());
            let amount: u128 = bal.try_into().expect(E_OVERFLOW);
            assert(amount != 0, E_NO_INPUT);
            erc20.approve(pool_address, bal);

            self.emit(CommitmentRecorded { commitment_key, channel_id, commitment_hash });
            array![OpenNoteDeposit { note_id, token, amount }].span()
        }

        fn add_channel(ref self: ContractState, channel_id: felt252, recipient: ContractAddress) {
            self.only_owner();
            assert(self.channels.read(channel_id).created_at == 0, E_EXISTS);
            self.channels.write(channel_id, Channel {
                recipient,
                state: ChannelState::PendingRegistration,
                created_at: get_block_timestamp(),
            });
            self.emit(ChannelAdded { channel_id, recipient });
        }

        fn activate_channel(ref self: ContractState, channel_id: felt252) {
            self.only_owner();
            let mut ch = self.channels.read(channel_id);
            assert(ch.created_at != 0, E_NO_CHANNEL);
            assert(ch.state == ChannelState::PendingRegistration, E_NOT_PENDING);
            ch.state = ChannelState::Active;
            self.channels.write(channel_id, ch);
            self.emit(ChannelActivated { channel_id });
        }

        fn terminate_channel(ref self: ContractState, channel_id: felt252) {
            self.only_owner();
            let mut ch = self.channels.read(channel_id);
            assert(ch.created_at != 0, E_NO_CHANNEL);
            assert(ch.state != ChannelState::Terminated, E_TERMINATED);
            ch.state = ChannelState::Terminated;
            self.channels.write(channel_id, ch);
            self.emit(ChannelTerminated { channel_id });
        }

        fn set_vesting(ref self: ContractState, channel_id: felt252, cliff_at: u64, schedule_hash: felt252) {
            self.only_owner();
            assert(self.channels.read(channel_id).created_at != 0, E_NO_CHANNEL);
            self.vesting.write(channel_id, VestingCommitment { cliff_at, schedule_hash, claimed: false });
        }

        fn claim_vested(ref self: ContractState, channel_id: felt252) {
            let ch = self.channels.read(channel_id);
            assert(get_caller_address() == ch.recipient, E_NOT_RECIPIENT);
            let mut v = self.vesting.read(channel_id);
            assert(v.schedule_hash != 0, E_NO_VESTING);
            assert(get_block_timestamp() >= v.cliff_at, E_CLIFF);
            assert(!v.claimed, E_CLAIMED);
            v.claimed = true;
            self.vesting.write(channel_id, v);
            self.emit(VestingClaimed { channel_id });
        }

        fn create_disclosure(
            ref self: ContractState,
            disclosure_id: felt252,
            fact_hash: felt252,
            verifier: ContractAddress,
            expires_at: u64,
            nullifier: felt252,
        ) {
            assert(!self.burned.read(nullifier), E_BURNED);
            assert(self.disclosures.read(disclosure_id).nullifier == 0, E_D_EXISTS);
            self.disclosures.write(disclosure_id, Disclosure {
                fact_hash, verifier, expires_at, nullifier, redeemed: false,
            });
            self.emit(DisclosureCreated { disclosure_id, verifier });
        }

        fn redeem_disclosure(ref self: ContractState, disclosure_id: felt252) -> bool {
            let mut d = self.disclosures.read(disclosure_id);
            assert(d.nullifier != 0, E_NO_DISCLOSURE);
            assert(get_caller_address() == d.verifier, E_WRONG_VERIFIER);
            assert(get_block_timestamp() < d.expires_at, E_EXPIRED);
            assert(!d.redeemed, E_REDEEMED);
            // Burn the nullifier — single redemption, no forwarding.
            self.burned.write(d.nullifier, true);
            d.redeemed = true;
            self.disclosures.write(disclosure_id, d);
            self.emit(DisclosureRedeemed { disclosure_id, nullifier: self.disclosures.read(disclosure_id).nullifier });
            true
        }

        fn get_channel(self: @ContractState, channel_id: felt252) -> Channel {
            self.channels.read(channel_id)
        }
        fn get_commitment(self: @ContractState, commitment_key: felt252) -> felt252 {
            self.commitments.read(commitment_key)
        }
        fn get_disclosure(self: @ContractState, disclosure_id: felt252) -> Disclosure {
            self.disclosures.read(disclosure_id)
        }
        fn check_disclosure(self: @ContractState, disclosure_id: felt252) -> felt252 {
            let d = self.disclosures.read(disclosure_id);
            if d.nullifier == 0 {
                return V_NOT_FOUND;
            }
            if d.redeemed {
                return V_REDEEMED;
            }
            if get_block_timestamp() >= d.expires_at {
                return V_EXPIRED;
            }
            V_VALID
        }
    }
}