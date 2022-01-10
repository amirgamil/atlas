const { gql, ApolloServer } = require("apollo-server");
const { Neo4jGraphQL } = require("@neo4j/graphql");
const neo4j = require("neo4j-driver");
require("dotenv").config({ path: "./scraper/neo4jWrapper/.env" });

const typeDefs = gql`
    type Account {
        addr: String!
        isUser: Boolean!
        tx: [Account!]!
            @relationship(type: "TO", properties: "Tx", direction: OUT)
    }

    interface Tx @relationshipProperties {
        blockNum: String!
        value: Float
        asset: String
        hash: String!
        distance: Float!
    }
`;

// const insertTxAndAccount = gql`
// mutation InsertTxAndAccount {
//   createMovies(input: [
//     {
//       title: "Forrest Gump"
//       released: 1994
//       director: {
//         create: {
//           node: {
//             name: "Robert Zemeckis"
//             born: 1951
//           }
//         }
//       }
//       actors: {
//         create: [
//           {
//             node: {
//               name: "Tom Hanks"
//               born: 1956
//             }
//             edge: {
//               roles: ["Forrest"]
//             }
//           }
//         ]
//       }
//     }
//   ]) {
//     movies {
//       title
//       released
//       director {
//         name
//         born
//       }
//       actorsConnection {
//         edges {
//           roles
//           node {
//             name
//             born
//           }
//         }
//       }
//     }
//   }
// }
// `

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
