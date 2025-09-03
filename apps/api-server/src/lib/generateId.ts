
export default function generateId(){
    return `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}