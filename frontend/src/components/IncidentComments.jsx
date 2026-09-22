import { useEffect, useState } from "react"
import api from "../api/api"

function IncidentComments({
  incidentId,
  users,
  currentUserRole,
  onCommentAdded,
}) {
  const [comments, setComments] = useState([])
  const [body, setBody] = useState("")
  const [isInternal, setIsInternal] = useState(false)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const canUseInternalNotes =
    currentUserRole === "admin" ||
    currentUserRole === "manager" ||
    currentUserRole === "agent"

  const fetchComments = async () => {
    try {
      setError("")

      const response = await api.get(
        `/incidents/${incidentId}/comments`
      )

      setComments(response.data)
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
          "Could not load comments."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [incidentId])

  const getUserName = (userId) => {
    const user = users?.find(
      (item) => item.id === Number(userId)
    )

    return user ? user.name : `User ${userId}`
  }

  const formatDate = (date) => {
    if (!date) return ""

    return new Date(date).toLocaleString()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const trimmedBody = body.trim()

    if (!trimmedBody) {
      setError("Please enter a comment.")
      return
    }

    try {
      setSubmitting(true)
      setError("")

      await api.post(
        `/incidents/${incidentId}/comments`,
        {
          body: trimmedBody,

          // Customers can never submit
          // an internal note from the frontend.
          is_internal:
            canUseInternalNotes && isInternal,
        }
      )

      setBody("")
      setIsInternal(false)

      await fetchComments()

      if (onCommentAdded) {
        onCommentAdded()
      }
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
          "Could not add comment."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="comments-card">

      <h2>Comments</h2>

      <form
        className="comment-form"
        onSubmit={handleSubmit}
      >

        <textarea
          value={body}
          onChange={(event) =>
            setBody(event.target.value)
          }
          placeholder="Write a comment..."
          rows="4"
        />

        <div className="comment-form-actions">

          {canUseInternalNotes ? (
            <label className="internal-note-option">

              <input
                type="checkbox"
                checked={isInternal}
                onChange={(event) =>
                  setIsInternal(
                    event.target.checked
                  )
                }
              />

              Internal note

            </label>
          ) : (
            <span />
          )}

          <button
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "Adding..."
              : "Add Comment"}
          </button>

        </div>

      </form>


      {error && (
        <p className="comment-error">
          {error}
        </p>
      )}


      {loading ? (
        <p>Loading comments...</p>
      ) : comments.length === 0 ? (
        <p>No comments yet.</p>
      ) : (
        <div className="comment-list">

          {comments.map((comment) => (
            <div
              className={`comment-item ${
                comment.is_internal
                  ? "internal-comment"
                  : ""
              }`}
              key={comment.id}
            >

              <div className="comment-header">

                <strong>
                  {getUserName(
                    comment.author_id
                  )}
                </strong>

                <span>
                  {formatDate(
                    comment.created_at
                  )}
                </span>

              </div>


              {comment.is_internal &&
                canUseInternalNotes && (
                  <span className="internal-badge">
                    Internal
                  </span>
                )}


              <p>{comment.body}</p>

            </div>
          ))}

        </div>
      )}

    </section>
  )
}

export default IncidentComments