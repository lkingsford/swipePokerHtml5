import express from 'express';

const app: any = express();
const port: any = 3000;
app.get('/', (req: express.Request, res: express.Response) => {
  res.send('The sedulous hyena ate the antelope!');
});
app.listen(port, (err: any) => {
  if (err) {
    return console.error(err);
  }
  return console.log(`server is listening on ${port}`);
});
