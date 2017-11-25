const express = require("express")
const axios = require("axios")
const bodyParser = require("body-parser")
const _ = require("lodash")

const app = express()

const ELISA = "https://rc-rest-api.elisaviihde.fi/rest/search/query"
const THEMOVIEDB = "https://api.themoviedb.org/3"
const THEMOVIEDB_API_KEY = process.env.THEMOVIEDB_API_KEY

app.use(bodyParser.json())

app.get("/movie", async (req, res) => {
  if(req.query.trailer) {
    try {
      let movie = await axios.get(THEMOVIEDB+"/search/movie?api_key="+THEMOVIEDB_API_KEY+"&query="+req.query.trailer)
      if (movie.data.results) {
        movie = _.first(movie.data.results)
        const id = movie.id ? movie.id : 0
        const trailers = await axios.get(THEMOVIEDB+"/movie/"+id+"/videos?api_key="+THEMOVIEDB_API_KEY)
        if (trailers.data.results) {
          const trailer = _.find(trailers.data.results, trailer => _.toLower(trailer.site) === "youtube")
          if (trailer) {
            res.send(trailer)
          } else {
            res.status(404)
            res.send({
              error: "No Youtube trailer found for movie"
            })                    
          }
        } else {
          res.status(404)
          res.send({
            error: "No Trailer found for movie"
          })          
        }
      } else {
        res.status(404)
        res.send({
          error: "No Movie found"
        })
      }
    } catch(err) {
      res.status(500)
      res.send({
        error: err
      })
    }
  } else {
    res.status(400)
    res.send({
      error: "Please Provide Movie ID"
    })
  }
})

app.get("/movies", async (req, res) => {
  if (req.query.genres) {
    const queries = req.query.genres.split(",")
    let movies = [];
    try {
      const result = await axios.get(ELISA+"?q="+queries.join(","))
      movies = _.map(result.data.results, movie => {
        const hits = _.pick(movie, "searchHits")
        return [...hits.searchHits]
      })
      movies = _.reduce(movies, (prev, next) => {
        return prev.concat(next)
      })
    } catch(err) {
      res.status(500)
      res.send({
        error: err.data
      });
      return
    }

    res.send({
      movies
    })

  } else {
    res.send({
      error: "Please give me genres"
    })
  }
})

app.get("/recommendations", (req, res) => {
    
})

app.listen(process.env.PORT || 5000);