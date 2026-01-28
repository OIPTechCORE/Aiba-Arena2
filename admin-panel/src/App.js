import axios from "axios"
import { useEffect, useState } from "react"

export default function App(){
  const [tasks,setTasks]=useState([])

  useEffect(()=>{fetchTasks()},[])

  const fetchTasks = async()=>{
    const res = await axios.get("http://localhost:5000/api/admin/tasks")
    setTasks(res.data)
  }

  return(
    <div>
      <h1>Admin Panel</h1>
      {tasks.map(t=><p key={t._id}>{t.title}</p>)}
    </div>
  )
}
