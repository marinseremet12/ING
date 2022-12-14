import React from 'react';
import Swal from 'sweetalert2'; //https://sweetalert2.github.io
import { myConfig } from '../../config.js';
import Utils from '../../utils';
import './Admin.scss';

class EasyAdmin extends React.Component {
    constructor(props) {
        super();

        this.state = {
            exchangeRate: 0,
            exchangeRateCandidate: 0,
            newOwnerCandidate: '',
            balance: 0,
            transferAmount: 0,
            transferAddress: ''
        }

        this.initData();
    }

    changeLoader(show) {
        this.props.onLoaderChange(show);
    }

    async initData() {
        this.getExchangeRate();
        this.getBalance();
    }

    // #region INIT
    async getExchangeRate() {
        let exchangeRate = await Utils.getExchangeRate();
        if (exchangeRate !== null) {
            this.setState({ exchangeRate: exchangeRate });
        }
    }

    async getBalance() {
        let balance = await Utils.getEasyEthBalance();

        if (typeof balance !== 'undefined' && balance !== null && balance > 0) {
            this.setState({ balance: balance / 1000000000000000000 });
        }
    }
    // #endregion

    // #region EXCHANGE RATE
    handleExchangeRateValueChange(event) {
        if (event.target.value <= 0) return;

        this.setState({ exchangeRateCandidate: parseInt(event.target.value) });
    }

    async handleChageExchangeRate() {
        if (typeof this.state.exchangeRateCandidate === 'undefined' || this.state.exchangeRateCandidate === null || this.state.exchangeRateCandidate === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Not correct value',
                text: 'New exchange rate should be greater then 0'
            })
            return;
        }

        this.changeLoader(true);

        Swal.fire({
            icon: 'question',
            title: 'Confirm BNB/IGL exchange rate change?',
            showCancelButton: true,
            html: 'Are you sure you want to change BNB/IGL exchange rate to <b>' + this.state.exchangeRateCandidate + "</b> (1??BNB = " + this.state.exchangeRateCandidate + "??IGL <br>(old exchange rate is <b>" + this.state.exchangeRate + "</b>)"
        }).then((result) => {
            if (result.isConfirmed) {
                this.chageExchangeRate();
            } else {
                this.changeLoader(false);
            }
        });

    }

    async chageExchangeRate() {
        await Utils.changeExchangeRate(this.state.exchangeRateCandidate)
            .then(
                result => {
                    console.log(result);
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        html: 'Nice! BNB/IGL exchange rate has been changed to <b>' + this.state.exchangeRateCandidate + '</b>. <br>Current page will be reloaded'
                    }).then(result => {
                        this.changeLoader(false);
                        window.location.reload();
                    });
                },
                error => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Fail',
                        html: error
                    }).then(result => {
                        this.changeLoader(false);
                    });
                }
            ).catch(error => {
                Swal.fire({
                    icon: 'error',
                    title: 'Fail',
                    html: error
                });
                console.log("Error");
                console.error(error);
            });;
    }
    // #endregion

    // #region TRANSFER
    handleTransferAmountChange(event) {
        let transferAmount = event.target.value;

        if (transferAmount <= 0) return;

        if (transferAmount > this.state.balance) {
            Swal.fire({
                icon: 'warning',
                title: 'Not enough funds',
                text: 'Contract balance is <b>' + this.state.balance + '??BNB</b>, and it\'s less than the entered transfer amount ' + transferAmount + '??BNB'
            })
            return;
        } else {
            this.setState({ transferAmount: parseFloat(event.target.value) });
        }
    }

    async handleTransferAddressChange(event) {
        let transferAddress = event.target.value;

        if (await Utils.isValidAddress(transferAddress)) {
            this.setState({ transferAddress: transferAddress });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Not valid address',
                html: 'Sorry, but provided input data <b>' + transferAddress + "</b>??is not a valid BNBEREUM address"
            });
        }
    }

    async handleTransfer() {
        if (this.state.transferAmount > this.state.balance) {
            Swal.fire({
                icon: 'warning',
                title: 'Not enough funds',
                text: 'Contract balance is less than the entered transfer amount'
            })
            return;
        }

        if (!this.state.transferAddress) {
            Swal.fire({
                icon: 'warning',
                title: 'Not correct address',
                text: 'Not valid recipient BNBEREUM address'
            })
            return;
        }

        this.changeLoader(true);

        Swal.fire({
            icon: 'question',
            title: 'Confirm transfer funds',
            showCancelButton: true,
            html: 'Are you sure you want to transfer <b>' + this.state.transferAmount + "??BNB</b> from <b>IGL&nbsp;smartcontract</b> to <b>" + this.state.transferAddress + "</b> address? This action is irreversible!"
        }).then((result) => {
            if (result.isConfirmed) {
                this.transferFunds();
            } else {
                this.changeLoader(false);
            }
        });
    }

    async transferFunds() {
        await Utils.transferFundsFromEasy(this.state.transferAddress, (this.state.transferAmount * 1000000).toString() + "000000000000")
            .then(
                result => {
                    console.log(result);
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        html: 'Nice! <b>' + this.state.transferAmount + 'BNB</b>s were transfered to <b>' + this.state.transferAddress + '</b>. '
                    }).then(result => {
                        this.changeLoader(false);
                    });
                },
                error => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Fail',
                        html: error
                    }).then(result => {
                        this.changeLoader(false);
                    });
                }
            ).catch(error => {
                Swal.fire({
                    icon: 'error',
                    title: 'Fail',
                    html: error
                }).then(result => {
                    this.changeLoader(false);
                });
                console.log("Error");
                console.error(error);
            });
    }
    // #endregion

    // #region CHANGE OWNER
    async handleNewOwnerValueChange(event) {
        let address = event.target.value;
        if (await Utils.isValidAddress(address)) {
            this.setState({ newOwnerCandidate: address });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Not valid address',
                html: 'Sorry, but provided input data <b>' + address + "</b>??is not a valid BSC address"
            });
        }
    }

    async handleChangeOwner() {
        if (!this.state.newOwnerCandidate) {
            Swal.fire({
                icon: 'warning',
                title: 'Not correct value',
                text: 'Not valid BSC address'
            })
            return;
        }

        this.changeLoader(true);

        Swal.fire({
            icon: 'question',
            title: 'Confirm owner change',
            showCancelButton: true,
            html: 'Are you sure you want to change <b>IGL contract</b> owner to <b>' + this.state.newOwnerCandidate + "</b>??<br>(current contract owner is <i>" + this.props.owner + "</i>)"
        }).then((result) => {
            if (result.isConfirmed) {
                this.chageOwner();
            } else {
                this.changeLoader(false);
            }
        });
    }

    async chageOwner() {
        await Utils.changeOwner(this.state.newOwnerCandidate, myConfig.CONTRACT_ADDRESS_EASYCOIN)
            .then(
                result => {
                    console.log(result);
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        html: 'Nice! IGL contract ownership has been transfered to <b>' + this.state.newOwnerCandidate + '</b>. <p>New contract owner must login to this page and accept ownership, meanwhile <b>' + this.props.owner + '</b> will stay the contract owner</p><p>Current page will be reloaded</b>'
                    }).then(result => {
                        this.changeLoader(false);
                        window.location.reload();
                    });
                },
                error => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Fail',
                        html: error
                    }).then(result => {
                        this.changeLoader(false);
                    });
                }
            ).catch(error => {
                Swal.fire({
                    icon: 'error',
                    title: 'Fail',
                    html: error
                }).then(result => {
                    this.changeLoader(false);
                });
                console.log("Error");
                console.error(error);
            });
    }
    // #endregion


    render() {
        return (
            <div className="admin-sub-block">
                <h1>IGL ADMIN</h1>
                <p>Contract address:
                    <a target="_blank" rel="noopener noreferrer" href={myConfig.ETHERSCAN_DOMAIN + "address/" + myConfig.CONTRACT_ADDRESS_EASYCOIN}>{myConfig.CONTRACT_ADDRESS_EASYCOIN}</a>
                </p>
                <h3>Exchange rate</h3>
                <div className="data-change-container">
                    <div className="subDiv">
                        <label>
                            CURRENT EXCHANGE RATE:
                        </label>
                        <div className="num-value">
                            {this.state.exchangeRate} BNB/IGL
                        </div>
                    </div>
                    <div className="subDiv">
                        <label>
                            NEW EXCHANGE RATE:
                        </label>
                        <input type="number" className="numberInput" step="1" onChange={this.handleExchangeRateValueChange.bind(this)} />
                        <div> BNB</div>
                        <div className="confirm-button" onClick={this.handleChageExchangeRate.bind(this)}>Change</div>
                    </div>
                </div>

                <h3>IGL token contract funds</h3>
                <div className="data-change-container">
                    <div className="subDiv">
                        <label>
                            TOTAL IGL CONTRACT BALANCE:
                        </label>
                        <div className="num-value">
                            {this.state.balance} BNB
                        </div>
                    </div>
                    <div className="subDiv">
                        <label>
                            TRANSFER AMOUNT:
                        </label>
                        <input type="number" className="numberInput" onChange={this.handleTransferAmountChange.bind(this)} />
                        <div> BNB</div>
                    </div>
                    <div className="subDiv">
                        <label className="short">
                            TRANSFER TO:
                        </label>
                        <input type="text" className="numberInput long" value={this.state.transferAddress} onChange={this.handleTransferAddressChange.bind(this)} />
                        <div className="confirm-button" onClick={this.handleTransfer.bind(this)}>Transfer</div>
                    </div>
                </div>

                <h3>IGL smartcontract owner</h3>
                <div className="data-change-container">
                    <div className="subDiv">
                        <label className="short">
                            CURRENT OWNER:
                        </label>
                        <div className="num-value">
                            {this.props.owner}
                        </div>
                    </div>
                    <div className="subDiv" style={{ display: this.props.unaccaptedOwner ? 'flex' : 'none' }}>
                        <label className="short">
                            UNACCAPTED NEW OWNER:
                        </label>
                        <div className="num-value">
                            {this.props.unaccaptedOwner}
                        </div>
                    </div>
                    <div className="subDiv">
                        <label className="short">
                            NEW OWNER:
                        </label>
                        <input type="text" className="numberInput long" value={this.state.referrId} onChange={this.handleNewOwnerValueChange.bind(this)} />
                        <div className="confirm-button" onClick={this.handleChangeOwner.bind(this)}>Change</div>
                    </div>
                </div>
            </div>
        );
    }
}


export default EasyAdmin;