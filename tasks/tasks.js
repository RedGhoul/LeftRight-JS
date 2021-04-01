const client = require('../database/database');
const cheerio = require('cheerio');
const Queue = require('bull');
const { SentimentAnalyzer } = require('node-nlp');

const { setQueues, BullAdapter, router } = require('bull-board');
const puppeteer = require('puppeteer');
const mainqq = new Queue('mainqq', {
    redis: {
        port: process.env.REDIS_PORT,
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSPORT
    }
});
const UpLoadFileImage = require('../tasks/uploader');
require('dotenv').config()
const { v4: uuidv4 } = require('uuid');
setQueues([
    new BullAdapter(mainqq)
]);
async function StartProcesses() {
    mainqq.process(async function (job, done) {
        client.query(`SELECT * FROM newssite;`).then(async (result, err) => {
            if (err) {
                return;
            }
            for (let index = 0; index < result.rows.length; index++) {
                try {
                    const element = result.rows[index];
                    console.log("Processing");
                    console.log(element);
                    const sentiment = new SentimentAnalyzer({ language: 'en' });

                    const browser = await puppeteer.launch({
                        args: ['--no-sandbox'],
                        headless: true
                    });
                    const page = await browser.newPage();

                    await page.setDefaultNavigationTimeout(0);

                    console.log("const page = await browser.newPage();");
                    try {
                        await page.goto(element.url, {
                            waitUntil: 'networkidle2'
                        });
                    } catch (error) {
                        console.log(error);
                        await browser.close();
                        return;
                    }
                    let fileName = `${element.name + uuidv4()}.png`;
                    await page.screenshot({ path: fileName, fullPage: true })
                    await UpLoadFileImage(fileName);
                    let snapShotId = await CreateSnapShot(element.id, fileName);
                    const data = await page.evaluate(() => document.querySelector('*').outerHTML);
                    const $ = cheerio.load(data);
                    if (element.name === 'CNN') {
                        const stuff = $(".cd__headline-text");
                        for (i = 0; i < stuff.length; i++) {
                            if (stuff[i].children[0].data) {
                                let headline = stuff[i].children[0].data;
                                let result = await sentiment.getSentiment(headline)
                                await CreateHeadLines(headline, result, snapShotId);

                            }
                        }
                    } else if (element.name === 'HuffPost') {
                        const stuff = $(".card__headline__text");
                        for (i = 0; i < stuff.length; i++) {
                            if (stuff[i].children[0].data) {
                                let headline = stuff[i].children[0].data;
                                let result = await sentiment.getSentiment(headline)
                                await CreateHeadLines(headline, result, snapShotId);

                            }
                        }
                    } else if (element.name === 'Fox') {
                        const stuff = $(".title.title-color-default");
                        for (i = 0; i < stuff.length; i++) {
                            if (stuff[i].children[0].children[0].data) {
                                let headline = stuff[i].children[0].children[0].data;
                                let result = await sentiment.getSentiment(headline)
                                await CreateHeadLines(headline, result, snapShotId);

                            }
                        }
                    }

                    await browser.close();
                    console.log("await browser.close();");
                    console.log("Completed " + element.name);
                } catch (error) {
                    console.log("Error Occured");
                    console.log(error)
                }
            }
            console.log("Done Job Exiting");
            done();
        });

    });
    const myJob = await mainqq.add(
        { gettingallheadlines: 'gettingallheadlines' },
        { repeat: { cron: '*/30 * * * *' } }
    );

}
const CreateSnapShot = async (newssite_id, imageurl,) => {
    let stuff = await client.query(`INSERT INTO snapshot (newssite_id, imageurl) VALUES ($1, $2) RETURNING id`,
        [newssite_id, imageurl]);
    return stuff.rows[0].id;
}


const CreateHeadLines = async (headline, value_text_sentiment, snapshot_id) => {
    await client.query(`INSERT INTO headline (value_text, value_text_sentiment, snapshot_id) VALUES ($1, $2, $3)`,
        [headline, value_text_sentiment, snapshot_id]);
}
module.exports = {
    StartProcesses: StartProcesses,
    Router: router
}

