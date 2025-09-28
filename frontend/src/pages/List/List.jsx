import { useContext, useEffect, useState } from "react";
import "./List.css";
import { url, currency } from "../../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";

const List = () => {
  const { token } = useContext(StoreContext);
  const [list, setList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentFood, setCurrentFood] = useState(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");

  const fetchList = async () => {
    try {
      const response = await axios.get(`${url}/api/food/list`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.data.success) {
        setList(response.data.data);
      } else {
        toast.error("Error fetching food list");
      }
    } catch (error) {
      toast.error("Network error");
      console.error("Fetch error:", error);
    }
  };

  const removeFood = async (foodId) => {
    try {
      const response = await axios.post(`${url}/api/food/remove`, {
        id: foodId
      } , {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.data.success) {
        await fetchList();
        toast.success(response.data.message);
      } else {
        toast.error("Error removing food");
      }
    } catch (error) {
      toast.error("Network error");
      console.error("Remove error:", error);
    }
  };

  const updateFood = async (foodId, updatedData) => {
    if (!updatedData.name || !updatedData.category || !updatedData.price) {
      toast.error("All fields are required");
      return false;
    }

    try {
      console.log("Sending update request with data:", {
        id: foodId,
        ...updatedData
      });

      const response = await axios.put(
        `${url}/api/food/update`,
        { id: foodId, ...updatedData },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        await fetchList();
        toast.success(response.data.message);
        return true;
      } else {
        toast.error("Error updating food");
        return false;
      }
    } catch (error) {
      toast.error("Network error");
      console.error("Update error:", error); // แสดง error ใน console เพื่อตรวจสอบเพิ่มเติม
      return false;
    }
  };

  const handleEditClick = (item) => {
    setCurrentFood(item);
    setName(item.name);
    setCategory(item.category);
    setPrice(item.price);
    setIsEditing(true);
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <div className="list add flex-col">
      <p>All Foods List</p>
      <div className="list-table">
        <div className="list-table-format title">
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b>Action</b>
        </div>
        {list.map((item, index) => (
          <div key={index} className="list-table-format">
            <img src={`${url}/images/` + item.image} alt={item.name} />
            <p>{item.name}</p>
            <p>{item.category}</p>
            <p>
              {currency}
              {item.price}
            </p>
            <div className="action-buttons">
              <p className="cursor" onClick={() => handleEditClick(item)}>
                Edit
              </p>
              <p className="cursor" onClick={() => removeFood(item._id)}>
                x
              </p>
            </div>
          </div>
        ))}
      </div>
      {isEditing && (
        <div className="edit-form">
          <h2>Edit Food</h2>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Food Name"
          />
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
          />
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price"
          />
          <button
            onClick={async () => {
              const success = await updateFood(currentFood._id, {
                name,
                category,
                price
              });
              if (success) {
                setIsEditing(false);
              }
            }}
          >
            Save
          </button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default List;
