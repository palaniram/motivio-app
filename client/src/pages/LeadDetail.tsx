import { useParams } from 'react-router-dom'

export default function LeadDetail() {
  const { id } = useParams()
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-navy">Lead Detail</h1>
      <p className="mt-2 text-gray-mid">Lead ID: {id}</p>
    </div>
  )
}
