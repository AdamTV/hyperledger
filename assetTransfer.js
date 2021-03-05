/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Modified by Adam Stinziani on 2021-03-05
 */

'use strict';

const {
    Contract
} = require('fabric-contract-api');

class AssetTransfer extends Contract {

    async InitLedger(ctx) {
        const assets = [{
                LotID: "001",
                PropagationMethod: "Seed",
                PropagationDate: "2021-03-05",
                PropagationQuantity: "1 gram",
            }, {
                LotID: "002",
                PropagationMethod: "Propagated Cuttings",
                PropagationDate: "2025-04-05",
                PropagationQuantity: "25 plants",
            }, {
                LotID: "003",
                PropagationMethod: "Seed",
                PropagationDate: "2050-06-09",
                PropagationQuantity: "2 grams",
            }, {
                LotID: "004",
                PropagationMethod: "Propagated Cuttings",
                PropagationDate: "2100-01-10",
                PropagationQuantity: "10 plants",
            }, {
                LotID: "005",
                PropagationMethod: "Seed",
                PropagationDate: "2121-09-05",
                PropagationQuantity: "1.5 grams",
            },
        ];

        for (const asset of assets) {
            asset.docType = 'asset';
            await ctx.stub.putState(asset.LotID, Buffer.from(JSON.stringify(asset)));
            console.info(`Asset ${asset.LotID} initialized`);
        }
    }

    // CreateAsset issues a new asset to the world state with given details.
    async CreateAsset(ctx, lotId, propagationMethod, propagationDate, propagationQuantity) {
        const asset = {
            LotID: lotId,
            PropagationMethod: propagationMethod,
            PropagationDate: propagationDate,
            PropagationQuantity: propagationQuantity,
        };
        ctx.stub.putState(lotId, Buffer.from(JSON.stringify(asset)));
        return JSON.stringify(asset);
    }

    // ReadAsset returns the asset stored in the world state with given lot lotId.
    async ReadAsset(ctx, lotId) {
        const assetJSON = await ctx.stub.getState(lotId); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${lotId} does not exist`);
        }
        return assetJSON.toString();
    }

    // UpdateAsset updates an existing asset in the world state with provided parameters.
    async UpdateAsset(ctx, lotId, propagationMethod, propagationDate, propagationQuantity) {
        const exists = await this.AssetExists(ctx, lotId);
        if (!exists) {
            throw new Error(`The asset ${lotId} does not exist`);
        }

        // overwriting original asset with new asset
        const updatedAsset = {
            LotID: lotId,
            PropagationMethod: propagationMethod,
            PropagationDate: propagationDate,
            PropagationQuantity: propagationQuantity,
        };
        return ctx.stub.putState(lotId, Buffer.from(JSON.stringify(updatedAsset)));
    }

    // DeleteAsset deletes an given asset from the world state.
    async DeleteAsset(ctx, lotId) {
        const exists = await this.AssetExists(ctx, lotId);
        if (!exists) {
            throw new Error(`The asset ${lotId} does not exist`);
        }
        return ctx.stub.deleteState(lotId);
    }

    // AssetExists returns true when asset with given lotId exists in world state.
    async AssetExists(ctx, lotId) {
        const assetJSON = await ctx.stub.getState(lotId);
        return assetJSON && assetJSON.length > 0;
    }

    // TransferAsset updates the owner field of asset with given lotId in the world state.
    async TransferAsset(ctx, lotId, newOwner) {
        const assetString = await this.ReadAsset(ctx, lotId);
        const asset = JSON.parse(assetString);
        asset.Owner = newOwner;
        return ctx.stub.putState(lotId, Buffer.from(JSON.stringify(asset)));
    }

    // GetAllAssets returns all assets found in the world state.
    async GetAllAssets(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({
                Key: result.value.key,
                Record: record
            });
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

}

module.exports = AssetTransfer;
