import jwt from 'jsonwebtoken';

const genToken = async (user) => {
    try {
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        return token;
    } catch (error) {
        console.error("Error generating token:", error);
        throw new Error("Token generation failed");
    }
};

export default genToken;
