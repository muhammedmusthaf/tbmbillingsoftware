import express from "express";
import { loginUser, registerUser } from "../controllers/auth.controller.js";


const auth = express.Router();

auth.post("/login", loginUser);

export default auth;