const { gql, ApolloServer } = require("apollo-server");
const { Neo4jGraphQL } = require("@neo4j/graphql");
const neo4j = require("neo4j-driver");
require("dotenv").config();

const typeDefs = gql`
  type Account {
    addr: String!
    tx: [Account] @relationship(type: "TO", properties: "Tx")
  }
  
  interface Tx @relationshipProperties {
    blockNum: String!
    value: Float
    asset: String
    hash: String!
    distance: Float!
  }
`;

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

const server = new ApolloServer({
  schema: neoSchema.schema,
});

server.listen().then(({ url }) => {
  console.log(`GraphQL server ready on ${url}`);
});