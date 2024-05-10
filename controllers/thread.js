// Thread controller - thread.js
const expressAsyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const validator = require('validator');
const { isValidObjectId } = require('mongoose');
const { checkAuth } = require('../controllers/auth')
const jwt = require('jsonwebtoken');
const { User, Thread } = require('../models/appModels');

// GET user profile by username
exports.user_profile = expressAsyncHandler(async (req, res) => {
    const { username } = req.params;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.render('profile', { title: user.username, user });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

// GET specific thread by id, as long as authenticated user is party
exports.spec_thread = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Verify the token to get the user ID
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.userId;

        // Get thread by ID and ensure the authenticated user is a party
        const thread = await Thread.findOne({ _id: id, party: userId }).populate('party', 'username');
        if (!thread) {
            return res.status(404).json({ message: 'Thread not found or you are not authorized to view this thread.' });
        }

        const user = await User.findById(userId);
        const otherUser = thread.party.find(partyMember => partyMember._id.toString() !== userId);
        const recipient = await User.findById(otherUser._id);

        console.log('Thread:', thread);
        console.log('User:', user);
        console.log('Recipient:', recipient);
        res.render('thread', { title: 'Thread', thread, user, recipient });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

// GET all threads where authenticated user is a party
exports.user_threads = expressAsyncHandler(async (req, res) => {

});

// POST new thread object containing authenticated user and a specified party
exports.new_thread = expressAsyncHandler(async (req, res) => {
    console.log('Creating new thread...')

    try {
       
        checkAuth(req, res, async () => {

            const { party } = req.body;

            if (party.length < 2) {
                return res.status(400).json({ message: 'Party must have at least two users.' });
            }

            const userIds = [];
            for (const username of party) {
                const user = await User.findOne({ username });
                if (!user) {
                    return res.status(400).json({ message: `User ${username} does not exist.` });
                }
                userIds.push(user._id);
            }

            const usersExist = await User.countDocuments({ _id: { $in: userIds } }) === party.length;
            if (!usersExist) {
                return res.status(400).json({ message: 'All users in the party must exist.' });
            }

            const existingThread = await Thread.findOne({ party: { $all: userIds } });
            if (existingThread) {
                return res.status(400).json({ message: 'Thread with the same party already exists.' });
            }

            const newThread = await Thread.create({
                party: userIds,
            });

            await User.updateMany(
                { _id: { $in: userIds } },
                { $push: { inbox: newThread._id } }
            );

            res.status(200).json({ message: 'Thread created successfully.', thread: newThread });
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

// POST a new message to a thread as authenticated user
exports.thread_message = expressAsyncHandler(async (req, res) => {
    const { author, content, threadId } = req.body;

    const sanitizedThredId = validator.escape(threadId);
    
    try {

        const thread = await Thread.findById(sanitizedThredId);
        if (!thread) {
            return res.status(404).json({ message: 'Thread not found.' });
        }

        const sanitizedAuthor = validator.escape(author);
        const sanitizedContent = validator.escape(content);

        const newMessage = {
            author: sanitizedAuthor,
            content: content,
            timestamp: new Date(),
        };

        thread.messages.push(newMessage);
        await thread.save();

        res.status(200).json({ message: 'Message added successfully.', thread });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

// POST status update
exports.status_update = expressAsyncHandler(async (req, res) => {
    const { username, status } = req.body;
    const sanitizedStatus = validator.escape(status);
    const sanitizedUser = validator.escape(username);

    try {

        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.userId;

        await User.findByIdAndUpdate(userId, { status: status });
        console.log('Status updated:', status, 'by', sanitizedUser);
        res.status(200).json({ message: 'Status update successfull.'});
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

// POST bio update
exports.bio_update = expressAsyncHandler(async (req, res) => {
    const { username, bio } = req.body;
    const sanitizedBio = validator.escape(bio);
    const sanitizedUser = validator.escape(username);

    try {

        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.userId;

        await User.findByIdAndUpdate(userId, { bio: sanitizedBio });
        console.log('Status updated:', sanitizedBio, 'by', sanitizedUser);
        res.status(200).json({ message: 'Bio update successfull.'});
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

// POST ext link update
exports.link_update = expressAsyncHandler(async (req, res) => {
    const { username, link } = req.body;
    const sanitizedLink = validator.escape(link);
    const sanitizedUser = validator.escape(username);

    try {

        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.userId;

        await User.findByIdAndUpdate(userId, { link: link });
        console.log('Link updated:', link, 'by', sanitizedUser);
        res.status(200).json({ message: 'Status update successfull.'});
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});