const someAddress = "0x...";
//to get all smart contracts a user has directly interacted with
`MATCH (acc:Account {addr: '${someAddress}'})-[edge:To]->(child:Account, { isUser: false })
RETURN acc, edge, child`;

//To get all users a user has directly interacted with
`MATCH (acc:Account {addr: '${someAddress}'})-[edge:To]->(child:Account, { isUser: true })
RETURN acc, edge, child`;

//To get similar accounts via collaborative filtering
//friend = someone who interacted with the same smart contract account you interacted with
`MATCH (acc:Account {addr: '${someAddress}'})-[:To]->(child:Account {isUser: false})<-[:To]-(friend:Account {isUser: true})-[:To]->(contract: Account {isUser: false})
WHERE NOT (acc)-[:To]->(contract) 
RETURN contract`;

//get Top 10 accounts sorted by distance
//friend = someone who interacted with the same smart contract account you interacted with
`MATCH (acc:Account {addr: '${someAddress}'})-[:To]->(child:Account {isUser: false})<-[:To]-(friend:Account {isUser: true})
WHERE NOT (acc)-[:To]->(contract) 
RETURN friend.addr, friend.distance as dist 
ORDER BY dist DESC
LIMIT 10
`;
