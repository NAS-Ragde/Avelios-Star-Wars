import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import axios from "axios";
const typeDefs = `#graphql
  type Character {
    name: String!
    height: String!
    mass: String!
    gender: String!
    birth_year: String!
    homeworld: String!
    films: [Film!]!
    species: [String!]
    eye_color: String!
  }
  
  type Film {
    title: String
  }
  
  type CharactersConnection {
    edges: [CharacterEdge]
    pageInfo: PageInfo
  }
  
  type CharacterEdge {
    node: Character
    cursor: String!
  }
  
  type PageInfo {
    hasNextPage: Boolean!
    endCursor: String
  }
  
  type Query {
    characters (first: Int, after: String): CharactersConnection
  }
`;
// const filmCache = new Map();
//
// // Fetch film title from cache or API
// const fetchFilmTitle = async (filmUrl) => {
//     if (filmCache.has(filmUrl)) {
//         return filmCache.get(filmUrl);
//     } else {
//         try {
//             const response = await axios.get(filmUrl);
//             const filmTitle = response.data.title;
//             filmCache.set(filmUrl, filmTitle);
//             return filmTitle;
//         } catch (error) {
//             console.error(`Failed to fetch film title: ${filmUrl}`, error);
//             return null;
//         }
//     }
// };
const resolvers = {
    Query: {
        characters: async (_, { first, after }) => {
            try {
                const pageUrl = after ? '?page=' + after : '';
                const url = 'https://swapi.dev/api/people/' + pageUrl;
                const response = await axios.get(url);
                const characters = response.data.results;
                const hasNextPage = !!response.data.next;
                const endCursor = hasNextPage ? response.data.next.split('=')[1] : null;
                // Fetch films
                const filmRequests = characters.map(async (character) => {
                    const filmUrls = character.films;
                    console.log('filmURL:', filmUrls);
                    const filmTitles = [];
                    for (const filmUrl of filmUrls) {
                        try {
                            const response = await axios.get(filmUrl);
                            filmTitles.push(response.data.title);
                        }
                        catch (error) {
                            console.error(`Failed to fetch film title: ${filmUrl}`, error);
                            filmTitles.push(null);
                        }
                    }
                    console.log('filmTitles', filmTitles);
                    character.films = filmTitles;
                    return character;
                });
                const charactersWithFilmTitles = await Promise.all(filmRequests);
                const edges = charactersWithFilmTitles.map((character, index) => ({
                    node: character,
                    cursor: (index + 1).toString(),
                }));
                return {
                    edges,
                    pageInfo: {
                        hasNextPage,
                        endCursor,
                    },
                };
            }
            catch (error) {
                console.error('Error:', error);
                throw new Error('Failed to fetch characters.');
            }
        },
    },
};
const server = new ApolloServer({
    typeDefs,
    resolvers,
});
const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
});
console.log(`Server ready at: ${url}`);
