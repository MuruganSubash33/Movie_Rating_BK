const express = require('express');
const router = express.Router();
const Movie = require('../models/movie'); 
const { getMovies, getMovieDetails, addMovie, deleteMovie, addComment } = require('../Controllers/movieController');
const { verifyAdmin, verifyToken } = require('../middleware/authMiddleware');


router.post('/', verifyAdmin, async (req, res) => {
  try {
    const { title, description, posterUrl, releaseDate, genre, rating } = req.body;
    const movie = new Movie({ title, description, posterUrl, releaseDate, genre, rating });
    await movie.save();
    res.status(201).json(movie);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add movie', error: err.message });
  }
});


router.get('/', async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching movies', error: err.message });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id).sort({ "comments.createdAt": -1 }); 
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    res.json(movie);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching movie details', error: err.message });
  }
});


router.get('/api/movies', async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 }); 
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch movies' });
  }
});


router.post('/:id/comments', verifyToken, async (req, res) => {
  try {
    const movieId = req.params.id;
    const { text, rating } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    const newComment = {
      text,
      rating: rating || 1,
      userId: req.user._id,
      username: req.user.username || 'Anonymous', 
      createdAt: new Date(),
    };

    movie.comments.unshift(newComment); 
    await movie.save();

    return res.status(200).json(movie);
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const deletedMovie = await Movie.findByIdAndDelete(req.params.id);
    if (!deletedMovie) return res.status(404).json({ message: 'Movie not found' });

    res.status(200).json({ message: 'Movie deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/:movieId/comments/:commentId', verifyToken, async (req, res) => {
  try {
    const { movieId, commentId } = req.params;
    const movie = await Movie.findById(movieId);

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    // Find the comment index
    const commentIndex = movie.comments.findIndex(comment => comment._id.toString() === commentId);
    
    if (commentIndex === -1) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is authorized to delete (only admin or comment owner can delete)
    if (req.user.role !== 'admin' && req.user._id.toString() !== movie.comments[commentIndex].userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized to delete this comment' });
    }

    // Remove the comment
    movie.comments.splice(commentIndex, 1);
    await movie.save();

    res.status(200).json({ message: 'Comment deleted successfully', movie });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/:movieId/comments/:commentId', verifyToken, async (req, res) => {
  try {
    const { movieId, commentId } = req.params;
    const { text, rating } = req.body;

    // Validate input
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ message: 'Text is required' });
    }
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    // Find the comment
    const commentIndex = movie.comments.findIndex(comment => comment._id.toString() === commentId);
    if (commentIndex === -1) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is authorized to edit (only comment owner can edit)
    if (req.user._id.toString() !== movie.comments[commentIndex].userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized to edit this comment' });
    }

    // Update the comment
    movie.comments[commentIndex].text = text.trim();
    movie.comments[commentIndex].rating = rating;
    movie.comments[commentIndex].updatedAt = new Date();

    await movie.save();

    res.status(200).json({ message: 'Comment updated successfully', movie });
  } catch (err) {
    res.status(500).json({ message: 'Error updating comment', error: err.message });
  }
});

module.exports = router;
