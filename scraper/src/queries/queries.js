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

// Get top contracts by number of users
`
MATCH (a: User)-[:To]->(b: Contract)
RETURN b, COUNT(a) as users
ORDER BY SIZE(users) DESC LIMIT 10
`;
