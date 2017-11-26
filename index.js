const express = require("express")
const axios = require("axios")
const bodyParser = require("body-parser")
const _ = require("lodash")
const sqlite3 = require("sqlite3")

const app = express()

const ELISA = "https://rc-rest-api.elisaviihde.fi/rest/search/query"
const THEMOVIEDB = "https://api.themoviedb.org/3"
const YOUTUBEAPI = "https://downloadmp.org/@api/json/videos/"
const THEMOVIEDB_API_KEY = process.env.THEMOVIEDB_API_KEY

const db = new sqlite3.Database('movies.db');

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
            const youtubes = await axios.get(YOUTUBEAPI+trailer.key)
            if (youtubes.data) {
              const vidInfo = youtubes.data.vidInfo
              const videos = _.filter(vidInfo, d => {
                return d.ftype === "mp4"
              }) 
              const max = videos.reduce((prev, current) => {
                return (Math.floor(Math.log(prev.rSize) / Math.log(1024)) > Math.floor(Math.log(current.rSize) / Math.log(1024))) ? prev : current
              })
              res.send(max)
            }
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

function getMovies(genres, callback) {
  db.serialize(() => {
    db.all(`
      SELECT M.*, C.name as Category FROM movies as M, categories as C
      INNER JOIN moviecategories 
      ON M.id = moviecategories.movieId
      INNER JOIN categories
      ON moviecategories.categoryId = C.id
      WHERE Category IN (${genres.join(",")})`, (err, row) => {
        if (err) {
          console.log(err)
        }
        callback(row)
      })
  })
}

const sql = `
SELECT M.*, C.name as Category FROM movies as M, categories as C
INNER JOIN moviecategories 
ON M.id = moviecategories.movieId
INNER JOIN categories
ON moviecategories.categoryId = C.id`

app.get("/movies", async (req, res) => {
  if (req.query.genres) {
    let movies = []
    const genres = _.map(req.query.genres.split(","), genre => "'" + genre + "'")

    getMovies(genres, rows => {
      movies = _.uniqBy([...rows], "Title")
      res.send({
        movies: _.slice(movies, 0, 60)
      })
    })

  } else {
    res.send({
      error: "Please give me genres"
    })
  }
})

app.post("/recommendations", (req, res) => {
  if (req.body.movies) {
    const movies = req.body.movies
    setTimeout(() => {
      const movie = movies[Math.floor(Math.random()*movies.length-1)]
      res.send(movie)
    }, 3000)
  } else {
    res.status(400)
    res.send({
      error: "Please give movies"
    })
  }
})

app.listen(process.env.PORT || 5000);