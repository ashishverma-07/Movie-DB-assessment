// protocol to use and site url
const RQ_PROTOCOL = "https" // http, https
const RQ_URL = "api.themoviedb.org/3";

// tags (api keywords)
const API_KEY_TAG = "api_key";
const PAGE_TAG = "page"
const DATE_GTE_TAG = "primary_release_date.gte";
const DATE_LTE_TAG = "primary_release_date.lte";
const DISCOVER_MOVIE_TAG = "discover/movie";
const DISCOVER_TV_TAG = "discover/tv";
const AIR_DATE_GTE_TAG = "air_date.gte";
const AIR_DATE_LTE_TAG = "air_date.lte";

// other constants
const API_KEY_CODE = "606aaffd7ca10f0b80804a1f0674e4e1";
const API_KEY = API_KEY_TAG + "=" + API_KEY_CODE;

const DATE_FROM = "2017-12-01";
const DATE_TO = "2017-12-31";

// construct base header for each request
function rqHeader() {
	return RQ_PROTOCOL + "://" + RQ_URL + "/";
}

// function to delay main thread for provided value of milliseconds
function sleep(ms) {
	ms += new Date().getTime();
	while (new Date() < ms){}
}

// makes synchronious get request based on provided url
// server may answer 429 error - too many requests made, please wait for XXX seconds
// in such case function waits for XXX seconds and resends request
function httpGet(theUrl) {
	var response = null;
	
	// internal helper function
	function makeRequest() {
		var xmlHttp = new XMLHttpRequest();
		xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
		xmlHttp.send(null);
		
		// if the server answered that limit of requests is reached then need to wait proposed timeout
		var retryTimeout = xmlHttp.getResponseHeader("retry-after");
		if (retryTimeout) {
			// wait timeout
			sleep(parseInt(retryTimeout) * 1000 + 100);
			// make request again
			makeRequest();
		} else {
			// produce response text
			response = xmlHttp.responseText;
		}
	}

	// send request
	makeRequest();

    return response;
}

// returns list of movies ids in range [dateFrom ... dateTo], date format "YY-MM-DD"
// request sample: https://api.themoviedb.org/3/discover/movie?api_key=606aaffd7ca10f0b80804a1f0674e4e1&page=1&primary_release_date.gte=2017-12-01&primary_release_date.lte=2017-12-31
function discoverMovies(dateFrom, dateTo) {
	// list to store movies ids
	var movies = [];
	var pageIndex = 1;
	var totalPages = 1;
	
	// make request for each page
	for (; pageIndex <= totalPages; ++pageIndex) {
		const request = rqHeader() +  DISCOVER_MOVIE_TAG + "?" + API_KEY + "&" + PAGE_TAG + "=" + pageIndex + "&" + DATE_GTE_TAG + "=" + dateFrom + "&" + DATE_LTE_TAG +"="+ dateTo;
		var response = JSON.parse(httpGet(request));
	
		// skip invalid response
		if (!response || !Array.isArray(response.results)) continue;
		// update pages count with value provided from server
		if (typeof response.total_pages != 'undefined' && response.total_pages > totalPages) {
			totalPages = response.total_pages;
		}
		
		// add movies to result list
		for (var i = 0; i < response.results.length; ++i) {
			var movie = response.results[i];
			if (typeof movie.id == 'undefined') continue;
			movies.push(movie.id);
		}
	}

	return movies;
}

// returs list of actors ids for movie of tv episode
// tagName - movie or tv
// request sample: https://api.themoviedb.org/3/movie/426030/credits?api_key=606aaffd7ca10f0b80804a1f0674e4e1
// request sample: https://api.themoviedb.org/3/tv/426030/credits?api_key=606aaffd7ca10f0b80804a1f0674e4e1
function getActors(tagName, episodeId) {
	var actors = [];

	const request = rqHeader() + tagName + "/" + episodeId + "/credits?" + API_KEY;
	var response = JSON.parse(httpGet(request));
	if (!response || !Array.isArray(response.cast)) return actors;
	
	// add actors to result list
	for (var i = 0; i < response.cast.length; ++i) {
		var actor = response.cast[i];
		if (!actor || typeof actor.id == 'undefined') continue;
		actors.push(actor.id);
	}
	
	return actors;
}

// returns list of tv episodes ids in range [dateFrom ... dateTo], date format "YY-MM-DD"
// request sample: https://api.themoviedb.org/3/discover/tv?api_key=606aaffd7ca10f0b80804a1f0674e4e1&sort_by=popularity.desc&air_date.gte=2017-12-01&air_date.lte=2017-12-31&page=1&include_null_first_air_dates=false
function discoverTV(dateFrom, dateTo) {
	// list to store tvEpisodes ids
	var tvEpisodes = [];
	var pageIndex = 1;
	var totalPages = 1;
	
	// make request for each page
	for (; pageIndex <= totalPages; ++pageIndex) {
		const request = rqHeader() +  DISCOVER_TV_TAG + "?" + API_KEY + "&" + PAGE_TAG + "=" + pageIndex + "&" + AIR_DATE_GTE_TAG + "=" + dateFrom + "&" + AIR_DATE_LTE_TAG +"="+ dateTo + "&include_null_first_air_dates=false";
		var response = JSON.parse(httpGet(request));
	
		// skip invalid response
		if (!response || !Array.isArray(response.results)) continue;
		// update pages count
		if (typeof response.total_pages != 'undefined' && response.total_pages > totalPages) {
			totalPages = response.total_pages;
		}
	
		// add tv episodes to result list	
		for (var i = 0; i < response.results.length; ++i) {
			var episode = response.results[i];
			if (typeof episode.id == 'undefined') continue;
			tvEpisodes.push(episode.id);
		}
	}

	return tvEpisodes;
}

// *** STAGE#1 -> get movies list
var discovered_movies = discoverMovies(DATE_FROM, DATE_TO);
document.getElementById('stage1').innerHTML = "Movies discovered: "  + discovered_movies.length;

// *** STAGE#2 -> get actors for discovered movies
var moviesActors = new Set();
for (var i = 0; i < discovered_movies.length; ++i) {
	var actors = getActors("movie", discovered_movies[i]);

	for (var j = 0; j < actors.length; ++j) {
		moviesActors.add(actors[j]);
	}
}
document.getElementById('stage2').innerHTML = "Movies actors discovered: "  + moviesActors.size;

// *** STAGE#3 -> get tv episodes list
var discovered_tvepisodes = discoverTV(DATE_FROM, DATE_TO);
document.getElementById('stage3').innerHTML = "TV episodes discovered: "  + discovered_tvepisodes.length;

// *** STAGE#4 -> get actors for discovered tv episodes
var tvActors = new Set();
for (var i = 0; i < discovered_tvepisodes.length; ++i) {
	var actors = getActors("tv", discovered_tvepisodes[i]);

	for (var j = 0; j < actors.length; ++j) {
		tvActors.add(actors[j]);
	}
}
document.getElementById('stage4').innerHTML = "TV episodes actors discovered: "  + tvActors.size;

// *** STAGE#5 -> get actors intersection in movies and tv episodes
var actorsIntersection = new Set([...moviesActors].filter(i => tvActors.has(i)));
document.getElementById('stage5').innerHTML = "How many actors and actresses were in at least one movie and at least one tv episode in December 2017? Answer: <b>"  + actorsIntersection.size + "</b>";
