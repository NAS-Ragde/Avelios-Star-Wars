import {Button, Table, Modal} from 'antd';
import {HeartFilled, HeartOutlined} from '@ant-design/icons';
import {useState, useEffect} from 'react';
import {useQuery} from "@apollo/client";
import {GET_CHARACTERS} from "../../queries/characters";
import React from "react";
import './Worktable.css';



enum StorageKeys {
    FAVORITES = 'favorites'
}

export default function Worktable() {

    const {loading, error, data, fetchMore} = useQuery(GET_CHARACTERS,{
        variables: {
            first: 10,
            after: null
        },
    });

    const [favoriteNames, setFavoriteNames] = useState<string[]>([]);
    const [isLoadMoreVisible, setIsLoadMoreVisible] = useState<boolean>(true);

    const transformCell = (cell) => {
        if (Array.isArray(cell)) {
            if (!cell.length) return '-';
            return cell.filter(item => item !== '').join(', ');
        }

        return cell === '' ? '-' : cell;
    }

    const handleFavoriteClick = (character) => {
        const isFavorite = favoriteNames.includes(character.name);

        const updatedFavoriteNames = isFavorite ?
            favoriteNames.filter(favCharacterName => favCharacterName !== character.name) :
            [...favoriteNames, character.name];

        setFavoriteNames(updatedFavoriteNames);

        localStorage.setItem(StorageKeys.FAVORITES, JSON.stringify(updatedFavoriteNames));
    };

    useEffect(() => {
        const storedFavorites = localStorage.getItem(StorageKeys.FAVORITES);
        if (storedFavorites) {
            const parsedFavorites = JSON.parse(storedFavorites);

            setFavoriteNames(parsedFavorites);
        }
    }, []);

    const FavoriteButton =
        ({isFavorite, onClick} : { isFavorite: boolean, onClick: () => void }) => {
            return isFavorite
                ? <Button icon={<HeartFilled/>} onClick={onClick}/>
                : <Button icon={<HeartOutlined/>} onClick={onClick}/>;
        };

    const [modalVisible, setModalVisible] = useState(false);
    const handleOnPress = () => {
        setModalVisible(true);
    }

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: text => <span className={'link'} onClick={handleOnPress}>{text}</span>
        },
        {
            title: 'Height',
            dataIndex: 'height',
            key: 'height',
            sorter: (a,b) => a.height - b.height,
        },
        {
            title: 'Mass',
            dataIndex: 'mass',
            key: 'mass',
            sorter: (a,b) => a.mass - b.mass,
        },
        {
            title: 'Planet',
            key: 'homeworld',
            dataIndex: 'homeworld',
        },
        {
            title: 'Specie',
            dataIndex: 'species',
            key: 'species',
            sorter: (a,b) => a.species - b.species,
        },
        {
            title: 'Gender',
            dataIndex: 'gender',
            key: 'gender',
            filters: [
                {
                    text: 'female',
                    value: 'female'
                },
                {
                    text: 'male',
                    value: 'male'
                },
                {
                    text: 'n/a',
                    value: 'n/a'
                },
            ],
            onFilter : (value, record) => record.gender.indexOf(value as string) === 0,
        },
        {
            title: 'Eye color',
            dataIndex: 'eye_color',
            key: 'eye_color',
            filters: [
                {
                    text: 'blue',
                    value: 'blue'
                },
                {
                    text: 'yellow',
                    value: 'yellow'
                },
                {
                    text: 'red',
                    value: 'red',
                },
                {
                    text: 'brown',
                    value: 'brown',
                },
                {
                    text: 'blue-gray',
                    value: 'blue-gray',
                },
            ],
            onFilter : (value, record) =>record.eye_color.indexOf(value as string) === 0,
        },
        {
            title: 'Favorites',
            key: 'favorite',
            filters: [
                {
                    text: 'favorites',
                    value: true,
                }
            ],
            onFilter : (value, record) => favoriteNames.includes(record.name),

            render: (text: string, record) => (
                <FavoriteButton
                    isFavorite={favoriteNames.includes(record.name)}
                    onClick={() => handleFavoriteClick(record)}/>
            ),
        },
    ];

    if (loading) return <p className={'jelly'}/>;
    if (error) return <p>{error.message}</p>;

    const { edges, pageInfo } = data.characters;

    const loadCharacters = () => {
        fetchMore({
            variables: {
                first: 10,
                after: pageInfo.endCursor,
            },
            updateQuery: (prev, { fetchMoreResult }) => {
                if (!fetchMoreResult) return prev;
                return {
                    characters: {
                        ...fetchMoreResult.characters,
                        edges: [...prev.characters.edges, ...fetchMoreResult.characters.edges],
                    },
                };
            },
        }).then(({data}) => {
            if (data.characters?.pageInfo?.endCursor === null) {
                setIsLoadMoreVisible(false);
            }
        });
    };


    const validatedData = edges.map(({node}) => {
        return{
            name: transformCell(node['name']),
            height: transformCell(node['height']),
            mass: transformCell(node['mass']),
            homeworld: transformCell(node['homeworld']),
            gender: transformCell(node['gender']),
            eye_color: transformCell(node['eye_color']),
            species: transformCell(node['species']),
        }
    })

    const filmList = edges.map(({ node }) => {
        const films = node.films;
        return films ? films.join(', ') : '';
    });


    return (
        <div className={'table-wrapper'}>
            <Table
                columns={columns}
                dataSource={validatedData}
                pagination={false}
                className={'table'}
            />

            <div>
                <Modal
                    title="Character"
                    centered
                    open={modalVisible}
                    onOk={() => setModalVisible(false)}
                    onCancel={() => setModalVisible(false)}
                    width={1000}
                >
                    <p>{filmList}</p>
                </Modal>
            </div>

            {isLoadMoreVisible && <button onClick={loadCharacters} className={'button'}>
                Load more
            </button>}
        </div>
    );
};
