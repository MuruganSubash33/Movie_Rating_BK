const Movie = require('../models/movie');
const User = require('../models/user');
const Comment = require('../models/comment'); // Assuming you have a Comment model


const getMovies = async (req, res) => {
  try {
    const movies = await Movie.find();
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMovieDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }
    res.json(movie);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addMovie = async (req, res) => {
  const { title, posterUrl, description, rating, releaseDate, genre } = req.body;

  try {
    const movie = new Movie({
      title,
      posterUrl,
      description,
      rating,
      releaseDate,
      genre,
    });
    await movie.save();
    res.status(201).json(movie);
  } catch (error) {
    console.error("Error saving movie:", error);
    res.status(400).json({ message: error.message });
  }
};

const deleteMovie = async (req, res) => {
  const { id } = req.params;

  try {
    const movie = await Movie.findByIdAndDelete(id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    res.status(200).json({ message: 'Movie deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


const addComment = async (req, res) => {
  try {
    const { text, rating } = req.body;
    const userId = req.user._id;
    const movieId = req.params.id;

    // Get the user to get their username
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create the comment with all required fields
    const newComment = new Comment({
      text,
      rating,
      userId,
      username: user.username,
      movieId
    });

    // Save the comment
    await newComment.save();

    // Add comment to movie's comments array
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    movie.comments.push(newComment._id);
    await movie.save();

    // Return the movie with populated comments
    const movieWithComments = await Movie.findById(movieId)
      .populate('comments', 'text rating username createdAt')
      .populate('comments.userId', 'username');

    res.status(201).json(movieWithComments);
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ 
      message: 'Error adding comment', 
      error: err.message 
    });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { movieId, commentId } = req.params;
    const movie = await Movie.findById(movieId);

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const editComment = async (req, res) => {
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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMovies, getMovieDetails, addMovie, deleteMovie, addComment, deleteComment, editComment };
