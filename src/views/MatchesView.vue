<script setup>
import { useRoute } from 'vue-router'
import { ref, reactive } from 'vue'
const { summonerId } = useRoute().params
import * as d3 from 'd3'
import CrystalBall from '@/components/CrystalBall.vue'
import Spinner from '@/components/Spinner.vue'

const matches = reactive([])
const showErrorMsg = ref(false)
const summonerName = ref('')
let puuid = ''

const proxyHost = import.meta.env.VITE_PROXY_HOST
const summonersURI = '/lol/summoner/v4/summoners'
const matchesURI = '/lol/match/v5/matches/by-puuid'
const matchesQueryString = '?queue=420&count=30' // solo q
const matchStatsURI = '/lol/match/v5/matches'

fetch(`${proxyHost}${summonersURI}/${summonerId}`)
  .then(res => res.json())
  .then(data => {
    summonerName.value = data.name
    puuid = data.puuid
    fetch(`${proxyHost}${matchesURI}/${puuid}/ids${matchesQueryString}`)
      .then(res => res.json())
      .then(data => {
        matches.push(...data)
        fetchMatchStats()
      })
  })
  .catch((e) => {
    console.error(e)
    showErrorMsg.value = true
  })

const matchStats = reactive({})
function fetchMatchStats() {
  var champList = {};
  var updatedChampList = [];
  var gameList = [];
  const matchPromises = []
  matches.forEach(match => {
    // use a subarray to develop to prevent reaching the limit.
    const matchPromise = new Promise((resolve, reject) => {
      fetch(`${proxyHost}${matchStatsURI}/${match}`)
        .then(res => res.json())
        .then(data => {
          const index = data.metadata.participants.indexOf(puuid)
          const stats = data.info.participants[index]
          if(stats.championName in champList){
            updatedChampList[champList[stats.championName]].Games++;
            updatedChampList[champList[stats.championName]].Kills += stats.kills;
            updatedChampList[champList[stats.championName]].Deaths += stats.deaths;
            updatedChampList[champList[stats.championName]].Assists += stats.assists;
            updatedChampList[champList[stats.championName]].Damage += stats.totalDamageDealtToChampions;
            if(stats.win==true){
              updatedChampList[champList[stats.championName]].Wins++;
            }
            updatedChampList[champList[stats.championName]].WinRate = Math.floor((updatedChampList[champList[stats.championName]].Wins/updatedChampList[champList[stats.championName]].Games) * 100) + '%';
          }else{
            champList[stats.championName] = updatedChampList.length;
            updatedChampList.push({"name":stats.championName,'championId':stats.championId,"Games":1,"Wins":0,"Kills":0,"Deaths":0,"Assists":0,"Damage":0,"WinRate":0});
            updatedChampList[champList[stats.championName]].Kills += stats.kills;
            updatedChampList[champList[stats.championName]].Deaths += stats.deaths;
            updatedChampList[champList[stats.championName]].Assists += stats.assists;
            updatedChampList[champList[stats.championName]].Damage += stats.totalDamageDealtToChampions;
            if(stats.win==true){
              updatedChampList[champList[stats.championName]].Wins++;
            }
            updatedChampList[champList[stats.championName]].WinRate = Math.floor((updatedChampList[champList[stats.championName]].Wins/updatedChampList[champList[stats.championName]].Games) * 100) + '%';
          }
          gameList.push({"name":stats.championName,'championId':stats.championId,"Kills":stats.kills, "Deaths":stats.deaths, "Assists":stats.assists, "Damage":stats.totalDamageDealtToChampions, "Games":1, "Wins":stats.win, "ID":match });
          delete stats.challenges
          delete stats.perks
          stats.show = false
          matchStats[match] = stats
          // process complete! fulfill the promise
          resolve()
        })
        .catch((e) => {
          reject(e)
          console.error(e)
        })
    })
    matchPromises.push(matchPromise)
  })
  // call visualization when all the matches have processed
  Promise.all(matchPromises)
    .then(() => visualization(gameList, updatedChampList))
}
function visualization(gameList, champList){
  gameList.sort(function(a, b) {          
    if (a.name === b.name) {
       return b.Wins - a.Wins
    }
    return a.name > b.name ? 1 : -1
  })
  for(var i=1; i<gameList.length; i++){
    if(gameList[i].name === gameList[i-1].name){
      gameList[i].Games = gameList[i-1].Games+1
    }
  }
  champList.sort((a, b) =>  {
    if (a.Wins === b.Wins) {
      return b.Games - a.Games
    }
    return b.Wins - a.Wins
  })
  makeChart(champList, gameList)
}

const chart = reactive({})
function makeChart (champList, gameList) {
  const nGames = d3.max(champList.map(d => d.Games))
  const labels = [...Array(nGames).keys()].map(i => i + 1)
  const x = d3.scaleBand()
    .domain(labels)
    .range([0, 900])
    .padding(0.1)

  const y = d3.scaleBand()
    .range([0, 1000])
    .domain(champList.map(d => d.name))
    .padding(0.2)

  chart.dots = []
  gameList.forEach(d => {
    chart.dots.push({
      game: d,
      style: {
        left: x(d.Games) + 'px',
        top: y(d.name) + y.bandwidth()/2 + 'px',
        /* width: x.bandwidth() + 'px', */
        /* height: x.bandwidth() + 'px', */
        /* 'background-color': d.Wins ? '#4394A7' : '#AE303C' */
      }
    })
  })
  chart.x = x
  chart.y = y
  chart.xLabels = labels
  chart.yLabels = champList.map(d => d.name)
  chart.done = true
}

const previewWindow = reactive({ show: false })

function showPreviewWindow ($event, game) {
  const { clientX, clientY } = $event
  previewWindow.data = game
  previewWindow.style = {
    top: clientY - 150 + 'px',
    left: clientX - 50 + 'px'
  }
  previewWindow.show = true
}
function updatePreviewWindow ($event) {
  const { clientX, clientY } = $event
  previewWindow.style = {
    top: clientY - 150 + 'px',
    left: clientX - 50 + 'px'
  }
}
function hidePreviewWindow () {
  previewWindow.show = false
  delete previewWindow.data
}

<<<<<<< HEAD
  gameList.forEach(object =>{
    var y = d3.scaleBand()
      .range([0, height])
      .domain(group)
      .padding([0.2])
    svg.append("g")
      .style("font", "13px sans-serif")
      .call(d3.axisLeft(y));
    var x = d3.scaleLinear()
      .domain([0, max])
      .range([0, width]);
    svg.append("g")
      .style("font", "13px sans-serif")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x));
    var dots = svg.selectAll("circle")
      .data(gameList)
      .enter().append("a")
      .attr("xlink:href", function(d){return "https://www.ernestchu.org/lol-vis/timeline/" + d.ID})
      .append("circle")
      .attr("class", "dot")
      .attr("r", 15)
      .attr("cx", function(d) {
        return x(d.Games)
      })
      .attr("cy", function(d) {
        return y(d.name) + y.bandwidth()/2
      })
      .style("fill", function(d) {
        if(d.Wins == true){
          return "skyblue"
=======
const champions = reactive({})
let ddragonChampSquarePrefix = ''
function ddragonChampSquare (id) {
  return ddragonChampSquarePrefix + `/${id}.png`
}
fetch('https://ddragon.leagueoflegends.com/api/versions.json')
  .then(res => res.json())
  .then(data => {
    ddragonChampSquarePrefix = `https://ddragon.leagueoflegends.com/cdn/${data[0]}/img/champion`
    fetch(`https://ddragon.leagueoflegends.com/cdn/${data[0]}/data/en_US/champion.json`)
      .then(res => res.json())
      .then(({ data }) => {
        /* ########### champion info ########## */
        /* keep keys/values we need */
        for (const [key, value] of Object.entries(data)) {
          /* dont use the championsId as key, fuck Fiddlesticks */
          champions[data[key]['key']] = [ 'id', 'key', 'name' ].reduce((prev, curr) => {
            prev[curr] = data[key][curr]
            return prev
          }, {})
>>>>>>> 21f224f45bce63fcf04a00a49de8876edf5f1e3d
        }
        /* #################################### */
      })
  })
</script>

<template>
  <template v-if="showErrorMsg">
    <div>
      <h2>The page has encountered an error!</h2>
      See the console for further informations.
    </div>
  </template>

  <div class="description" v-if="matches.length">
    <div class="title">{{ summonerName }}'s matches</div>
    <div class="content">Hover on the crystal balls to explore</div>
  </div>

  <Transition>
  <div class="chart" v-if="chart.done">
    <div
      class="y-axis"
      v-for="label in chart.yLabels"
      :style="{ top: chart.y(label) + 'px' }"
    >
      <img :src="ddragonChampSquare(label)"
            :style="{ width: Math.min(chart.x.bandwidth(), chart.y.bandwidth()) + 'px', 'border-radius': '50%' }">
    </div>
    <div
      class="x-axis"
      v-for="label in chart.xLabels"
      :style="{ left: chart.x(label) - chart.y.bandwidth() / 4 + 'px' }"
    >
      {{ label }}
      <template v-if="label === chart.xLabels[chart.xLabels.length - 1]">
        (Games in total)
      </template>
    </div>
    <CrystalBall
      v-for="dot in chart.dots"
      class="crystal"
      :style="dot.style"
      :win="dot.game.Wins"
      :bandwidth="Math.min(chart.x.bandwidth(), chart.y.bandwidth())"
      @mouseenter="showPreviewWindow($event, dot.game)"
      @mousemove="updatePreviewWindow($event)"
      @mouseleave="hidePreviewWindow()"
      @click="$router.push({ name: 'timeline', params: { matchId: dot.game.ID } })"
    />
  </div>
  </Transition>

  <Spinner class="spinner" v-if="!chart.done" />

  <div class="preview-window" v-if="previewWindow.show" :style="previewWindow.style">
    <img :src="ddragonChampSquare(champions[previewWindow.data.championId].id)" alt="">
    <div class="KDA">
      {{ `${previewWindow.data.Kills}/${previewWindow.data.Deaths}/${previewWindow.data.Assists}` }}
    </div>
    <div class="damage">{{ previewWindow.data.Damage }} DAMAGE DEALT</div>
    <div class="border"></div>
    <div class="click">Click to view the match timeline</div>
  </div>
</template>

<style scoped>
.spinner {
 position: fixed;
 top: 100px;
 left: 200px;
} 
.description {
  margin: 30px 0 130px 30px;
  font-family: 'Share Tech Mono', monospace;
}
.description .title {
  font-size: 35px;
}
.description .content {
  font-size: 20px;
}

button {
  color: black;
}
.match-no {
  color: #B3944C;
  cursor: pointer;
}
.chart {
  position: relative;
  margin-left: 200px;
}
.chart .y-axis {
  left: -150px;
}
.chart .x-axis {
  top: -60px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 30px;
  white-space: nowrap;
}
.chart > div {
  position: absolute;
}
.chart .crystal:hover {
  cursor: pointer;
}

.preview-window {
  position: fixed;
  width: 250px;
  height: 100px;
  background-color: #fff1;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  z-index: 999;
}
.preview-window img {
  position: absolute;
  top: 10%;
  left: -5%;
  height: 80%;
}
.preview-window > div.KDA {
  position: absolute;
  right: 5%;
  top: 10%;
  font-family: 'Share Tech Mono', monospace;
  font-size: 40px;
}
.preview-window > div.damage {
  position: absolute;
  right: 5%;
  bottom: 15%;
  font-size: 15.5px;
  font-family: 'Share Tech Mono', monospace;
}
.preview-window > div.click {
  position: absolute;
  white-space: nowrap;
  left: 50%;
  bottom: -40%;
  font-size: 15.5px;
  font-family: 'Share Tech Mono', monospace;
}
.preview-window > div.border {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  border: 3px solid #B3944C;
}

.v-enter-active,
.v-leave-active {
  transition: all 0.5s ease-out;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

</style>
