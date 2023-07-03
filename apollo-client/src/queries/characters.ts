import {gql} from "@apollo/client";

export const GET_CHARACTERS = gql`
query GetCharacters($first: Int, $after: String) {
    characters(first: $first, after: $after) {
      edges {
        node {
          name
          height
          mass
          gender
          birth_year
          homeworld
          films {
            title
          }
          species
          eye_color
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;
