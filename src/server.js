/* eslint-disable */

const bodyParser = require('body-parser');
const express = require('express');

const Post = require('./post.js');

const STATUS_USER_ERROR = 422;

const server = express();
// to enable parsing of json bodies for post requests

server.use(bodyParser.json());

// TODO: write your route handlers here

server.get('/post/:soID', (req, res) => {
  Post.find({ soID: req.params.soID })
    // .sort({ acceptedAnswerID: 1 })
    .then(posts => res.json(posts))
    .catch(err => res.status(422).json(err));
});

server.get('/accepted-answer/:soID', (req, res) => {
  Post.findOne({ soID: req.params.soID })
    .then(post => {
      if (post.acceptedAnswerID === null) {
        res.status(422).json({ error: 'No accepted answer.' });
        return;
      }

      Post.findOne({ soID: post.acceptedAnswerID })
        .then(postAnswer => res.status(200).json(postAnswer))
        .catch(err => res.status(422).json(err));
    })
    .catch(error => {
      res.status(422).json(error);
    });
});

server.get('/top-answer/:soID', (req, res) => {
  const { soID } = req.params;

  if (!Number.isInteger(+soID)) {
    res.status(422).json({ error: 'soID given does not match pattern.' });
    return;
  }

  Post.findOne({ soID: req.params.soID }).then(post => {
    if (post === null) {
      res
        .status(422)
        .json({ error: `No post with id ${req.params.soID} was found.` });
      return;
    }
    console.log(post);
    const answerId =
      post.acceptedAnswerID !== null ? post.acceptedAnswerID : -1;

    Post.findOne({ parentID: req.params.soID })
      .where('soID')
      .ne(answerId)
      .sort({ score: -1 })
      .then(post => {
        if (post === null) {
          res.status(422).json({ error: `No post with top answer found.` });
          return;
        }

        res.status(200).json(post);
      });
  });
});

server.get('/popular-jquery-questions', (req, res) => {
  Post.find({ tags: 'jquery' })
    .where({ parentID: null })
    .or([{ score: { $gt: 5000 } }, { 'user.reputation': { $gt: 200000 } }])
    .then(posts => res.json(posts))
    .catch(err => res.status(STATUS_USER_ERROR).json(err));
});

server.get('/npm-answers', (req, res) => {
  Post.find({ tags: 'npm' })
    .then(posts => {
      if (posts.length === 0) {
        res
          .status(STATUS_USER_ERROR)
          .json({ error: 'No posts with npm found.' });
        return;
      }

      const answers = posts.map(postInfo => {
        return postInfo.soID;
      });

      Post.find()
        .where('parentID')
        .in(answers)
        .then(answerPosts => res.status(200).json(answerPosts))
        .catch(err => res.status(STATUS_USER_ERROR).json(err));
    })
    .catch(err => res.status(STATUS_USER_ERROR).json(err));
});

module.exports = { server };
