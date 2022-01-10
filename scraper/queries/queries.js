const someAddress = "0x...";
//to get all nodes pointed to by a specific address
`MATCH (acc:Account {addr: '${someAddress}'})-[edge:TO]->(child:Account)
RETURN acc, edge, child`;

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
