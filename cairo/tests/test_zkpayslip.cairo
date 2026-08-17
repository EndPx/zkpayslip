#[cfg(test)]
mod tests {
    use strk20_invoke_helper::{
        IZkPayslipDispatcherTrait, IZkPayslipDispatcher,
        STATE_PENDING, STATE_ACTIVE, STATE_TERMINATED,
    };
    use starknet::ContractAddress;
    use snforge_std::{
        ContractClassTrait, DeclareResultTrait, declare,
        start_cheat_caller_address, stop_cheat_caller_address,
    };
    use core::traits::TryInto;

    fn addr(f: felt252) -> ContractAddress {
        f.try_into().unwrap()
    }

    fn deploy_zkpayslip(owner: ContractAddress) -> (IZkPayslipDispatcher, ContractAddress) {
        let class = declare("ZkPayslip").unwrap().contract_class();
        let (address, _) = class.deploy(@array![owner.into()]).unwrap();
        (IZkPayslipDispatcher { contract_address: address }, address)
    }

    #[test]
    fn test_channel_lifecycle() {
        let owner = addr(0x111);
        let recipient = addr(0x222);
        let (zkp, contract_addr) = deploy_zkpayslip(owner);

        start_cheat_caller_address(contract_addr, owner);
        zkp.add_channel('ch1', recipient);

        let ch = zkp.get_channel('ch1');
        assert(ch.state == STATE_PENDING, 'expected pending');
        assert(ch.recipient == recipient, 'recipient mismatch');

        zkp.activate_channel('ch1');
        let ch2 = zkp.get_channel('ch1');
        assert(ch2.state == STATE_ACTIVE, 'expected active');

        zkp.terminate_channel('ch1');
        let ch3 = zkp.get_channel('ch1');
        assert(ch3.state == STATE_TERMINATED, 'expected terminated');
        stop_cheat_caller_address(contract_addr);
    }

    #[test]
    fn test_disclosure_redeem_once() {
        let owner = addr(0x311);
        let verifier = addr(0xBAB);
        let (zkp, contract_addr) = deploy_zkpayslip(owner);

        start_cheat_caller_address(contract_addr, owner);
        zkp.create_disclosure('d1', 'FACT_HASH', verifier, 9999999999_u64, 'NULL1');
        stop_cheat_caller_address(contract_addr);

        let v1 = zkp.check_disclosure('d1');
        assert(v1 == 'VALID', 'expected valid');

        start_cheat_caller_address(contract_addr, verifier);
        let ok = zkp.redeem_disclosure('d1');
        assert(ok, 'redeem should succeed');
        stop_cheat_caller_address(contract_addr);

        let v2 = zkp.check_disclosure('d1');
        assert(v2 == 'REDM', 'expected redeemed');
    }
}