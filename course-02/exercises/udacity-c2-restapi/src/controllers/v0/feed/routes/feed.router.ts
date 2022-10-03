import { Router, Request, Response } from 'express';
import { FeedItem } from '../models/FeedItem';
import { requireAuth } from '../../users/routes/auth.router';
import * as AWS from '../../../../aws';

const router: Router = Router();

// Get all feed items
router.get('/', requireAuth, async (req: Request, res: Response) => {
    const items = await FeedItem.findAndCountAll({order: [['id', 'DESC']]});
    items.rows.map((item) => {
            if(item.url) {
                item.url = AWS.getGetSignedUrl(item.url);
            }
    });
    res.send(items);
});

//GET a specific resource by Primary Key
router.get('/:id', 
   requireAuth,
   async (req: Request, res: Response) => {
    let id = +req.params.id;
    const feed = await getFeedByPK(id, res);
    if(feed == null)
        return res;
    return res.status(200).send(feed);
   })

// update a specific resource
router.patch('/:id', 
    requireAuth, 
    async (req: Request, res: Response) => {
    let id : number = +req.params.id;
    const feed = await getFeedByPK(id, res);
    if(feed == null)
        return res;
    const newCaption = validAndGetCaption(req, res);

    const updatedFeeed = await feed.update({caption : newCaption},{where:{id:id}})
    res.status(204).send(updatedFeeed);
});

// Get a signed url to put a new item in the bucket
router.get('/signed-url/:fileName', 
    requireAuth, 
    async (req: Request, res: Response) => {
    let { fileName } = req.params;
    const url = AWS.getPutSignedUrl(fileName);
    res.status(201).send({url: url});
});

// Post meta data and the filename after a file is uploaded 
// NOTE the file name is they key name in the s3 bucket.
// body : {caption: string, fileName: string};
router.post('/', 
    requireAuth, 
    async (req: Request, res: Response) => {
    const caption = validAndGetCaption(req, res);
    const fileName = validAndGetURL(req, res);

    const item = await new FeedItem({
            caption: caption,
            url: fileName
    });

    const saved_item = await item.save();

    saved_item.url = AWS.getGetSignedUrl(saved_item.url);
    res.status(201).send(saved_item);
});

async function getFeedByPK(id: number, res: Response) : Promise<FeedItem> {
    if ( !id ) {
        res.status(400).send(`id is required`);
        return null;
    }
    const feed =  await FeedItem.findByPk(id);
    
    if (feed == null) {
        res.status(400).send(`There is no feed with this id : ${id}`);
        return null;
    }
    return feed;
}

function validAndGetCaption(req: Request, res: Response) {
    const caption = req.body.caption;
    // check Caption is valid
    if (!caption) {
        return res.status(400).send({ message: 'Caption is required or malformed' });
    }
    return caption;
}

function validAndGetURL(req: Request, res: Response) {
    const fileName = req.body.url;
    // check Filename is valid
    if (!fileName) {
        return res.status(400).send({ message: 'File url is required' });
    }
    return fileName;
}

export const FeedRouter: Router = router;