import { Router, Request, Response } from 'express';
import { config } from '../config/config';
import { NextFunction } from 'connect';
const http = require('http');
  


export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.headers || !req.headers.authorization){
      return res.status(401).send({ message: 'No authorization headers.' });
  }
  
  // Setting the configuration for the request
  const options = {
    port: config.authorizationServer.port,
    hostname: config.authorizationServer.hostname,
    path: '/api/v0/users/auth/verification',
    method: 'GET',
    headers: {
      'Authorization':req.headers.authorization
    }
  };

  http.request(options, (resp: Response) => {
    let data = '';

    resp.on('data', (chunk) => {
      data += chunk;
    });

    // Ending the response 
    resp.on('end', () => { 
      console.log(data); 
      if(resp.statusCode === 200)  
        return next();
      else
      return res.status(resp.statusCode).send(data);
    });

  }).on("error", (err: any) => { return res.send(err);}).end();
  
  
}
   