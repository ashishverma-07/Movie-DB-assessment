Deliverables:
- index.html -> file to be opened via your internet browser that runs moviedb_script.js script
- moviedb_script.js -> script that searches for results from moviedb and updates state of index.html
- Results.PNG -> screen shot of result

How to run:

Preconditions:
- have Internet access
- browser should allow javascript files execution

Actions:
- open index.html by your browser

Observations:
- It takes time ( 20 - 30 seconds) for moviedb_script.js to fetch all the data because of limitation from server side. More details on https://www.themoviedb.org/faq/api :
=============================================================
Are there limitations on the number of requests?
We currently rate limit requests to 40 requests every 10 seconds. You can inspect the status of your limits by looking at the X-RateLimit response headers
=============================================================
- Finally you should see results similar to Results.PNG, but there might be a minor difference because Movies database might be altered.
