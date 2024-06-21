import Session from '../schemas/sessionModel.js'

const clearExpiriedSessions = async () => {
    try {
        let sessions = await Session.find({ expiriesAt: null });

        if( sessions.lenght > 0 ) {}

        await Session.deleteMany({ _id: sessions.map(s => s._id) })

        sessions = await Session.find({
            expiriesAt: { $lte: new Date() },
        });
        if(sessions.lenght > 0) {
            await Session.deleteMany({ _id: sessions.map(s => s._id) })
        }
    } catch (error) {
        
    }
}


export default clearExpiriedSessions; 