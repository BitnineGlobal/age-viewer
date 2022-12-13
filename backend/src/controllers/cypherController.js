/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

const CypherService = require("../services/cypherService");
const sessionService = require("../services/sessionService");
const GraphCreator = require("../models/GraphCreator");

class CypherController {
    async executeCypher(req, res) {
        let connectorService = sessionService.get(req.sessionID);
        if (connectorService.isConnected()) {
            let cypherService = new CypherService(
                connectorService.graphRepository
            );
            let data = await cypherService.executeCypher(req.body.cmd);
            res.status(200).json(data).end();
        } else {
            throw new Error("Not connected");
        }
    }

    async createGraph(req, res, next) {
        let db = sessionService.get(req.sessionID);
        if (db.isConnected()){
            let cypherService = new CypherService(
                db.graphRepository
            );
            console.log(req.files, req.body);
            try {
                let graph = new GraphCreator({
                    nodes: req.files.nodes,
                    edges: req.files.edges,
                    graphName: req.body.graphName,
                    dropGraph: req.body.dropGraph
                });
                await graph.parseData();
                const DROP = graph.query.graph.drop;
                const CREATE = graph.query.graph.create;
                console.log(graph.query.nodes, graph.query.edges);
                if (DROP){
                    await cypherService.executeCypher(DROP)
                }
                await cypherService.executeCypher(CREATE);
                await Promise.all(graph.query.labels.map(async (q)=>{
                    return await cypherService.executeCypher(q);
                }));
                await Promise.all(graph.query.nodes.map(async (q)=>{
                    return await cypherService.executeCypher(q);
                }));
                await Promise.all(graph.query.edges.map(async (q)=>{
                    return await cypherService.executeCypher(q);
                }));
                // await cypherService.createGraph();
                res.status(204).end();                
            } catch (e){
                throw e;
            }

        }
    }
}

module.exports = CypherController;
