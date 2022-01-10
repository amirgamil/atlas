const someAddress = "0x...";
//to get all smart contracts a user has directly interacted with
`MATCH (acc:Account {addr: '${someAddress}'})-[edge:TO]->(child:Account, { isUser: false })
RETURN acc, edge, child`;

//to get all users a user has directly interacted with
`MATCH (acc:Account {addr: '${someAddress}'})-[edge:TO]->(child:Account, { isUser: true })
RETURN acc, edge, child`;

//to get similar accounts via collaborative filtering
//friend = someone who interacted with the same smart contract account you interacted with
`MATCH (acc:Account {addr: '${someAddress}'})-[:TO]->(child:Account {isUser: false})<-[:TO]-(friend:Account {isUser: true})
WHERE accAccount <> friend
RETURN friend`;

//get top 10 accounts sorted by distance
//friend = someone who interacted with the same smart contract account you interacted with
`MATCH (acc:Account {addr: '${someAddress}'})-[:TO]->(child:Account {isUser: false})<-[:TO]-(friend:Account {isUser: true})
WHERE accAccount <> friend
RETURN friend.addr, friend.distance as dist 
ORDER BY dist DESC
LIMIT 10
`;

//mutation
const createTx = ({ to, from, blockNum, value, asset, hash, distance }) => gql`
mutation CreateTx {
  createAccounts(input: {
    addr: ${from},
    tx: {
      connectOrCreate: [{
        where: {node: {addr: ${to}}
        onCreate: { node: {
          addr: ${to},
        }, edge: {
          blockNum: ${blockNum}
          value: ${value}
          asset: ${asset}
          hash: ${hash}
          distance: ${distance}
        }}
      }]
    }
  }) {
    info {
      nodesCreated
      relationshipsCreated
    }
  }
}
`;
