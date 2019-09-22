#!/usr/bin/env node

const app = require('commander');
const inquirer = require('inquirer');
const https = require('https');
const baseApi = 'https://api.tvmaze.com/';

let searchTerm = '';
let searchResult = '';
let films = '';
let summaryResult = '';

const prompt = (input) => {
  return inquirer.prompt(input);
}
const request =(term) => {
  return new Promise((resolve,reject) => {
    const api = baseApi + `search/shows?q=${term}`;
    https.get(api,(resp) => {
      resp.on('data', (chunk) => {
        searchResult += chunk;
      });
      resp.on('end',() =>{
        let filmNames = [];
        const result =JSON.parse(searchResult)
        for(let i = 0; i<result.length;i++){
          filmNames.push(result[i].show.name);
        }
        resolve(filmNames);
      })
    })
  })
}
const showFilms = (filmNames) =>{
  const choices =[{type:'list',name:'choice',message:'Your Choice is',choices:filmNames}]
  prompt(choices).then(answers => {
    const result =JSON.parse(searchResult)
    for(let i = 0;i<result.length;i++){
      if(answers.choice === result[i].show.name){
        if(result[i].show.summary){
          summaryResult = result[i].show.summary.replace(/<(.|\n)*?>/g, '')
          console.log('\n' + summaryResult + '\n');
        } else {
          console.log('\n No Summary Found \n');
        }
      }
    }
    afterSummary();
  })
}
const afterSummary = () => {
  const newSearch =[{type:'list',name:'choice',message:'Action',choices:['New Search','Go back to previous results',]}]
  prompt(newSearch).then(answers => {
      if(answers.choice === 'Go back to previous results') {
        console.log('\n '+summaryResult + '\n');
        afterSummary();
      } else if (answers.choice === 'New Search'){
        tvShower();
      }
    })
}
const tvShower = () => {
  let input = [{type:'input', name:'name', message:'Show Name:'}];
  prompt(input).then(answers => {
    if(answers.name === searchTerm){
      if(films.length<=0){
        console.log('\n No films found with ' + searchTerm + '\n')
        tvShower();
      } else {
        showFilms(films);
      }
    } else {
      searchResult = '';
      searchTerm = answers.name;
      request(searchTerm)
      .then((filmNames)=>{
        films = filmNames;
        if(filmNames.length <=0){
          searchResult= '';
          console.log('\n No films found with ' + searchTerm+ '\n' )
          tvShower();
        } else {
          showFilms(filmNames);
        }})
      .catch(console.log);
    }
  })
}

app
.version('1.0.0')
.action(tvShower);

app.parse(process.argv);

module.exports.prompt = prompt;