import React from "react";

// A HTML and CSS only rating picker thanks to: https://codepen.io/chris22smith/pen/MJzLJN

const RatingPicker = ({ name = "rating", defaultValue = 5 }) => {
  return (
    <p className="rating-picker">
      <input
        className="radio-input"
        type="radio"
        id="star5"
        name={name}
        value="5"
        defaultChecked={defaultValue === 5}
      />
      <label className="radio-label" htmlFor="star5" title="5 stars">
        5 stars
      </label>

      <input
        className="radio-input"
        type="radio"
        id="star4"
        name={name}
        value="4"
        defaultChecked={defaultValue === 4}
      />
      <label className="radio-label" htmlFor="star4" title="4 stars">
        4 stars
      </label>

      <input
        className="radio-input"
        type="radio"
        id="star3"
        name={name}
        value="3"
        defaultChecked={defaultValue === 3}
      />
      <label className="radio-label" htmlFor="star3" title="3 stars">
        3 stars
      </label>

      <input
        className="radio-input"
        type="radio"
        id="star2"
        name={name}
        value="2"
        defaultChecked={defaultValue === 2}
      />
      <label className="radio-label" htmlFor="star2" title="2 stars">
        2 stars
      </label>

      <input
        className="radio-input"
        type="radio"
        id="star1"
        name={name}
        value="1"
        defaultChecked={defaultValue === 1}
      />
      <label className="radio-label" htmlFor="star1" title="1 star">
        1 star
      </label>
    </p>
  );
};

export default RatingPicker;
