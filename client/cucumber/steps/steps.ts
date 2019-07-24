/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

'use strict';
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as myExtension from '../../src/extension';
import { BlockchainWalletExplorerProvider } from '../../src/explorer/walletExplorer';
import { BlockchainGatewayExplorerProvider } from '../../src/explorer/gatewayExplorer';
import { BlockchainRuntimeExplorerProvider } from '../../src/explorer/runtimeOpsExplorer';
import { BlockchainPackageExplorerProvider } from '../../src/explorer/packageExplorer';

// tslint:disable:no-unused-expression

chai.use(sinonChai);
chai.use(chaiAsPromised);
const should: Chai.Should = chai.should();

export enum LanguageType {
    CHAINCODE = 'chaincode',
    CONTRACT = 'contract'
}

const otherFabricInstantiatedContracts: string[] = [];

module.exports = function(): any {

    this.Given('the other fabric is setup with contract name {string} and version {string}', this.timeout, async (contractName: string, version: string) => {
        const FabricHelper: any = require('../helpers/remoteFabricHelper');
        const remoteFabricHelper: any = new FabricHelper.RemoteFabricHelper();
        const item: string = otherFabricInstantiatedContracts.find((contract: string) => {
            return contract === `${contractName}@${version}`;
        });
        if (!item) {
            await remoteFabricHelper.connect();
            await remoteFabricHelper.installChaincode(contractName, version);
            await remoteFabricHelper.instantiateChaincode(contractName, version);
            otherFabricInstantiatedContracts.push(`${contractName}@${version}`);
        }
    });

    this.Then(/^there should be an? (installed smart contract |instantiated smart contract |Channels |Node |Organizations |identity )?tree item with a label '(.*?)' in the '(Smart Contracts|Local Fabric Ops|Fabric Gateways|Fabric Wallets)' panel( for item)?( .*)?$/, this.timeout, async (child: string, label: string, panel: string, thing2: string, thing: string) => {
        let treeItems: any[];
        if (panel === 'Smart Contracts') {
            const blockchainPackageExplorerProvider: BlockchainPackageExplorerProvider = myExtension.getBlockchainPackageExplorerProvider();
            treeItems = await blockchainPackageExplorerProvider.getChildren();
        } else if (panel === 'Local Fabric Ops') {
            const blockchainRuntimeExplorerProvider: BlockchainRuntimeExplorerProvider = myExtension.getBlockchainRuntimeExplorerProvider();
            if (!child) {
                treeItems = await blockchainRuntimeExplorerProvider.getChildren();
            } else if (child.includes('installed smart contract')) {
                const allTreeItems: any[] = await blockchainRuntimeExplorerProvider.getChildren();
                const smartContracts: any[] = await blockchainRuntimeExplorerProvider.getChildren(allTreeItems[0]);
                treeItems = await blockchainRuntimeExplorerProvider.getChildren(smartContracts[0]); // Installed smart contracts
            } else if (child.includes('instantiated smart contract')) {
                const allTreeItems: any[] = await blockchainRuntimeExplorerProvider.getChildren();
                const smartContracts: any[] = await blockchainRuntimeExplorerProvider.getChildren(allTreeItems[0]);
                treeItems = await blockchainRuntimeExplorerProvider.getChildren(smartContracts[1]); // Instantiated smart contracts
            } else if (child.includes('Channels')) {
                const allTreeItems: any[] = await blockchainRuntimeExplorerProvider.getChildren();
                treeItems = await blockchainRuntimeExplorerProvider.getChildren(allTreeItems[1]); // Channels
            } else if (child.includes('Node')) {
                const allTreeItems: any[] = await blockchainRuntimeExplorerProvider.getChildren();
                treeItems = await blockchainRuntimeExplorerProvider.getChildren(allTreeItems[2]); // Nodes
            } else if (child.includes('Organizations')) {
                const allTreeItems: any[] = await blockchainRuntimeExplorerProvider.getChildren();
                treeItems = await blockchainRuntimeExplorerProvider.getChildren(allTreeItems[3]); // Organizations
            } else {
                treeItems = await blockchainRuntimeExplorerProvider.getChildren();
            }
        } else if (panel === 'Fabric Gateways') {
            const blockchainGatewayExplorerProvider: BlockchainGatewayExplorerProvider = myExtension.getBlockchainGatewayExplorerProvider();
            treeItems = await blockchainGatewayExplorerProvider.getChildren();
        } else if (panel === 'Fabric Wallets') {
            const blockchainWalletExplorerProvider: BlockchainWalletExplorerProvider = myExtension.getBlockchainWalletExplorerProvider();
            treeItems = await blockchainWalletExplorerProvider.getChildren();
            if (child && child.includes('identity') && thing && thing2) {
                const walletIndex: number = treeItems.findIndex((item: any) => {
                    return item.label === thing.trim();
                });
                if (walletIndex < 0) {
                    throw new Error('Name of thing doesn\'t exist');
                }
                treeItems = await blockchainWalletExplorerProvider.getChildren(treeItems[walletIndex]);
            }
        } else {
            throw new Error('Name of panel doesn\'t exist');
        }

        // Find tree item using label
        const treeItem: any = treeItems.find((item: any) => {
            return item.label === label;
        });

        should.exist(treeItem);

        this.treeItem = treeItem;
    });

    this.Then(/^there shouldn't be an? (instantiated smart contract )?tree item with a label '(.*?)' in the '(Local Fabric Ops)' panel$/, this.timeout, async (child: string, label: string, panel: string) => {
        let treeItems: any[];
        if (panel === 'Local Fabric Ops') {
            const blockchainRuntimeExplorerProvider: BlockchainRuntimeExplorerProvider = myExtension.getBlockchainRuntimeExplorerProvider();
            if (child.includes('instantiated smart contract')) {
                const allTreeItems: any[] = await blockchainRuntimeExplorerProvider.getChildren();
                const smartContracts: any[] = await blockchainRuntimeExplorerProvider.getChildren(allTreeItems[0]);
                treeItems = await blockchainRuntimeExplorerProvider.getChildren(smartContracts[1]); // Instantiated smart contracts
            } else {
                throw new Error('unrecognised child ' + child);
            }
        } else {
            throw new Error('Name of panel doesn\'t exist');
        }

        // Find tree item using label
        const treeItem: any = treeItems.find((item: any) => {
            return item.label === label;
        });

        should.not.exist(treeItem);
    });

    this.Then("the tree item should have a tooltip equal to '{string}'", this.timeout, async (tooltipValue: string) => {
        tooltipValue = tooltipValue.replace(/\\n/g, `\n`); // Add line breaks
        this.treeItem.tooltip.should.equal(tooltipValue);
    });

    this.Then("the logger should have been called with '{string}', '{string}' and '{string}'", this.timeout, async (type: string, popupMessage: string, outputMessage: string) => {
        this.userInputUtilHelper.logSpy.should.have.been.calledWith(type, popupMessage, outputMessage);
    });
};
