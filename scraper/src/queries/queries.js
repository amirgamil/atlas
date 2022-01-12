const someAddress = "0x...";
//to get all smart contracts a user has directly interacted with
`MATCH (acc:User {addr: '${someAddress}'})-[edge:To]->(child:Contract)
RETURN acc, edge, child`;

//To get all users a user has directly interacted with
`MATCH (acc:User {addr: '${someAddress}'})-[edge:To]->(child:isUser)
RETURN acc, edge, child`;

//To get similar accounts via collaborative filtering
//friend = someone who interacted with the same smart contract account you interacted with
`MATCH (acc:User {addr: '${someAddress}'})-[:To]->(child:Contract)<-[:To]-(friend:User)-[:To]->(contract: Contract)
WHERE NOT (acc)-[:To]->(contract)
RETURN contract`;

//get Top 10 accounts sorted by distance
//friend = someone who interacted with the same smart contract account you interacted with
`MATCH (acc:User {addr: '${someAddress}'})-[:To]->(child:Contract)<-[:To]-(friend:User)
WHERE NOT (acc)-[:To]->(contract)
RETURN friend.addr, friend.distance as dist
ORDER BY dist DESC
LIMIT 10
`;


`________`

`
MATCH p = (a {addr: $address})-[*..3]-(b) RETURN a, b, p LIMIT 100
`

"list all communities"
`
MATCH (a) WHERE a.community IS NOT NULL
WITH distinct(collect(a.community)) as res
UNWIND res as unwinded
RETURN distinct(unwinded)
`

"popular graph"
`
MATCH (a)-[r:To]-(b) WHERE r.count > 30 RETURN a, b
`

"create popular graph"
`
CALL gds.graph.create.cypher(
  'popGraph',
  'MATCH (a)-[r:To]-(b) WHERE r.count > 30
   WITH collect(a) + collect(b) as r
   UNWIND r as n
   WITH DISTINCT n as n
   RETURN id(n) as id, labels(n) as labels',
  'MATCH p = (a)-[r:To]-(b)
   WHERE r.count > 30
   UNWIND relationships(p) as n
   RETURN id(startNode(n)) as source, id(endNode(n)) as target, type(n) as type, n.count as count'
)
YIELD
  graphName AS graph, nodeCount AS nodes, relationshipCount AS rels
`

"create local graph"
`
CALL gds.graph.create.cypher(
  'localGraph',
  'MATCH p = (a {addr: $addr})-[*1..2]-(b)
    UNWIND nodes(p) as q
    WITH distinct(q) as n
    RETURN id(n) as id, labels(n) as labels',
  'MATCH p = (a {addr: $addr})-[*1..2]-(b)
    UNWIND relationships(p) as n
    RETURN id(startNode(n)) as source, id(endNode(n)) as target, type(n) as type, n.count as count
    ',
  { parameters: { addr: "0x75a01babec60ebc02f402ce3d6d60865ace4c62f" } }
)
YIELD
  graphName AS graph, nodeCount AS nodes, relationshipCount AS rels
`

"write graph"
`
CALL gds.louvain.write('localGraph6', { consecutiveIds: true, relationshipWeightProperty: 'count', writeProperty: 'community' })
YIELD communityCount, modularity
`

"stream graph"
`
CALL gds.louvain.stream('localGraph6', { consecutiveIds: true, relationshipWeightProperty: 'count' })
YIELD nodeId, communityId
RETURN gds.util.asNode(nodeId).addr, communityId
`

// Get top contracts by number of users
`
MATCH (a: User)-[:To]->(b: Contract)
RETURN b, COUNT(a) as users
ORDER BY SIZE(users) DESC LIMIT 10
`;
