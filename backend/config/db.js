import mongoose from "mongoose";
import 'dotenv/config'
const connectDB=async()=>{
    try{
        const connectionDB = await mongoose.connect(process.env.MONGO_URI);
        console.log(`connect to DB ${connectionDB.connection.host}`)
    }catch(error){
        console.log(error);
    }
}
export default connectDB;