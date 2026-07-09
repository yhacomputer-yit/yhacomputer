import { useNavigate } from "react-router-dom";

export default function CourseCard({ course }) {
  const navigate = useNavigate();
  const go = () => navigate("/courses/" + course.id);

  return (
    <div className="card course-card-home">
      {course.image && <img src={"/" + course.image.replace(/^\/+/, "")} alt={course.title} />}
      {course.level && <span className="level-badge">{course.level}</span>}
      <h3>{course.title}</h3>
      <div className="course-info">
        {course.duration && (
          <span className="course-info-item">&#9201; {course.duration}</span>
        )}
        {course.price && (
          <span className="course-info-item price">{course.price}</span>
        )}
      </div>
      <button className="btn-enroll" onClick={go}>
        View Details
      </button>
    </div>
  );
}
