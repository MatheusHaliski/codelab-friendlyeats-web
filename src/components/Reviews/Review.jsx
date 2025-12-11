import renderStars from "@/src/components/Stars.jsx";

export function Review({ grade, comment, email, timestamp }) {
  return (
    <li className="review__item">
      <div className="review__row">
        <div className="review__score">
          <ul className="restaurant__rating">{renderStars(grade)}</ul>
          <span className="review__grade">{grade?.toFixed?.(1) ?? grade}/5</span>
        </div>
        <div className="review__content">
          <p className="review__email">{email}</p>
          <p>{comment}</p>
        </div>
      </div>

      <time>
        {new Intl.DateTimeFormat("en-GB", {
          dateStyle: "medium",
        }).format(timestamp)}
      </time>
    </li>
  );
}

export function ReviewSkeleton() {
  return (
    <li className="review__item">
      <div className="restaurant__rating">
        <div
          style={{
            height: "2rem",
            backgroundColor: "rgb(156 163 175)",
            width: "10rem",
          }}
        ></div>
      </div>
      <div
        style={{
          height: "19px",
          backgroundColor: "rgb(156 163 175)",
          width: "12rem",
        }}
      ></div>
      <p>{"   "}</p>
    </li>
  );
}
