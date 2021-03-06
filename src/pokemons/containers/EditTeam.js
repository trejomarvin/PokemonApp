import React, { Component } from 'react';
import { FlatList } from 'react-native';
import { connect } from 'react-redux';
import firebase from 'react-native-firebase';
import { NavigationActions, StackActions } from 'react-navigation'

import Loading from '../../shared/components/Loading';
import SelectedTeamLayout from '../components/SelectedTeamLayout';
import EditTeamLayout from '../components/EditTeamLayout';
import PokemonListLayout from '../components/PokemonListLayout';

import Empty from '../../shared/components/Empty';
import Pokemon from '../components/Pokemon';
import SelectedPokemon from '../components/SelectedPokemon';
import SelectedTeamEmpty from '../components/SelectedTeamEmpty';
import SaveSelectedTeam from '../components/SaveSelectedTeam';

class EditTeam extends Component{
  
  state = {
    loading: true,
    item: {},
    teamList: [],
    pokemonList: []
  }

  static navigationOptions = ({navigation}) => {
    return {
      title: `Editar equipo de la región: ${navigation.getParam('regionName', '')}`
    }
  }

  async componentWillMount(){
    await this.getParamItem();
    await this.fetchPokedex();
    this.setState({
      loading: false
    })
  }

  async getParamItem() {
    let item = this.props.navigation.getParam('item', {});
    
    let itemList = [];

    item.team.map((obj) => {
      itemList.push({
        entry_number: obj.entry_number,
        pokemon_species: obj.pokemon_species
      })
    })

    this.setState({
      item: item,
      teamList: itemList
    })
  }

  async fetchPokedex() {
    let { pokedexUrl } = this.state.item

    await fetch(pokedexUrl).then(response => {
      return response.json();
    }).then(responseData => {
      let pokemons = [...responseData.pokemon_entries]
      let selectedPokemons = [...this.state.teamList]

      var uniqueResultOne = pokemons.filter(function(pokemon) {
        return !selectedPokemons.some(function(selectedPokemon) {
          return pokemon.entry_number == selectedPokemon.entry_number;
        });
      });
    
      var uniqueResultTwo = selectedPokemons.filter(function(selectedPokemon) {
        return !pokemons.some(function(pokemon) {
          return selectedPokemon.entry_number == pokemon.entry_number;
        });
      });

      var result = uniqueResultOne.concat(uniqueResultTwo);

      this.setState({
        pokemonList: result
      })
    }).catch(error => {
      console.log(error)
    });

  }

  keyExtractor = (item) => {
    return(item.pokemon_species.name.toString());
  }

  renderEmpty = () => {
    return(<Empty message='No se encontro ningún pokemon' />);
  }

  renderSelectedTeamEmpty = () => {
    return(<SelectedTeamEmpty />);
  }

  renderPokemon = ({item}) => {
    return(
      <Pokemon 
        {...item} 
        onPokemonSelected={() => { this.pokemonSelected(item)}}
        disableAddButton={
          this.state.teamList.length < 6 ? false : true
        }
        onPokemonInfo={() => this.pokemonInfo(item)}
      />
    )
  }

  renderSeletedPokemon = ({item}) => {
    return(
      <SelectedPokemon
        {...item}
        onRemovePokemon={() => {this.removePokemon(item)}}
        onPokemonInfo={() => this.pokemonInfo(item)}
      />
    )
  }

  pokemonSelected = (item) => {
    this.setState({
      teamList: [...this.state.teamList, item]
    })

    const pokemons = [...this.state.pokemonList]
    const filteredItems = pokemons.filter(pokemon => pokemon !== item)
    
    this.setState({
      pokemonList: filteredItems
    })
  }

  removePokemon = (item) => {
    const teamList = [...this.state.teamList]
    const filteredTeamList = teamList.filter(pokemon => pokemon !== item)

    this.setState({
      teamList: filteredTeamList,
      pokemonList: [...this.state.pokemonList, item]
    })
  }

  saveTeam = () => {
    
    let { id } = this.state.item

    firebase.database().ref(`pokedexes/${this.props.user.uid}/${id}`).update({
      team: this.state.teamList
    }).then(() => {
      const resetAction = StackActions.reset({
        index: 0,
        actions: [
          NavigationActions.navigate({ routeName: 'MyTeams', key: 'MyTeams' })
        ],
      });
      this.props.navigation.dispatch(resetAction);
    }).catch((error) => {
      console.log(error)
    });
  }

  pokemonInfo = (item) => {
    const navigationAction = NavigationActions.navigate({
      routeName: 'ShowPokemon',
      params: {
        item: item
      }
    });

    this.props.navigation.dispatch(navigationAction)
  }

  render(){

    if(this.state.loading){
      return(<Loading />)
    }
    return(
      <EditTeamLayout>
        <SelectedTeamLayout>
          <FlatList 
            horizontal
            data={this.state.teamList}
            keyExtractor={this.keyExtractor}
            ListEmptyComponent={this.renderSelectedTeamEmpty}
            ItemSeparatorComponent={this.itemSeparator}
            renderItem={this.renderSeletedPokemon}
          />
          <SaveSelectedTeam 
            onSaveTeam={() => this.saveTeam()}
            disableSaveButton={
              this.state.teamList.length >= 3 ? false : true
            }
          />
        </SelectedTeamLayout>
        <PokemonListLayout>
          <FlatList 
            data={this.state.pokemonList}
            keyExtractor={this.keyExtractor}
            ListEmptyComponent={this.renderEmpty}
            ItemSeparatorComponent={this.itemSeparator}
            renderItem={this.renderPokemon}
          />
        </PokemonListLayout>
      </EditTeamLayout>
    );
  }
}

function mapStateToProps(state){
  return{
    authorize: state.authorize,
    user: state.user,
    baseUrl: state.baseUrl
  }
}

export default connect(mapStateToProps)(EditTeam);