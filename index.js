const express = require("express")
const axios = require("axios")
const bodyParser = require("body-parser")
const _ = require("lodash")

const app = express()

const ELISA = "https://rc-rest-api.elisaviihde.fi/rest/search/query"

app.use(bodyParser.json())

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
      err: "Please give me genres"
    })
  }
})

app.post("/recommend", () => {
    
})

app.listen(process.env.PORT || 5000);