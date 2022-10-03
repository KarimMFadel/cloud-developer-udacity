import express, { Router, Request, Response }  from 'express';
import bodyParser from 'body-parser';
import {filterImageFromURL, deleteLocalFiles} from './util/util';
import {requireAuth} from './util/authUtil';

(async () => {

  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;
  
  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  // GET /filteredimage?image_url={{URL}}
  // Filter an image from a public url.
  //    1. validate the image_url query
  //    2. call filterImageFromURL(image_url) to filter the image
  //    3. send the resulting file in the response
  //    4. deletes any files on the server on finish of the response
  // QUERY PARAMATERS
  //    image_url: URL of a publicly accessible image
  // RETURNS
  //   the filtered image file
  app.get( "/filteredimage", requireAuth, async (req: Request, res: Response) => {
    let { image_url } : {image_url:string} = req.query;
    if ( !image_url ) {
      res.status(400).send(`image_url is required`);
      return null;
    }

    filterImageFromURL(image_url)
      .then(filteredpath => {
        res.sendFile(filteredpath, err => {
        deleteLocalFiles([filteredpath]);
      })
    })
    .catch(ex => {
      res.status(400).send('url is malformed or unvalid');
    });
  });
  //! END filteredimage service
  
  // Root Endpoint
  // Displays a simple message to the user
  app.get( "/", async (req: Request, res: Response) => {
    res.send("try GET /filteredimage?image_url={{}}")
  } );
  

  // Start the Server
  app.listen( port, () => {
      console.log( `server running http://localhost:${ port }` );
      console.log( `press CTRL+C to stop server` );
  } );
})();