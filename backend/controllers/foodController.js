import { getAllFoods, createFood, deleteFood, editFood } from "../services/foodService.js";

const listFood = async (req, res) => {
    try {
        const foods = await getAllFoods();
        res.json({ success: true, data: foods });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

const addFood = async (req, res) => {
    try {
        let image_filename = `${req.file.filename}`;

        await createFood({
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            category: req.body.category,
            image: image_filename,
        });

        res.json({ success: true, message: "Food Added" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

const removeFood = async (req, res) => {
    try {
        await deleteFood(req.body.id);
        res.json({ success: true, message: "Food Removed" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

const updateFood = async (req, res) => {
    const { id, name, description, price, category } = req.body;

    try {
        const updatedFood = await editFood(id, { name, description, price, category });

        if (!updatedFood) {
            return res.status(404).json({ success: false, message: "Food item not found" });
        }

        res.json({ success: true, message: "Food updated successfully", data: updatedFood });
    } catch (error) {
        console.error("Error updating food:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }

    console.log("Request Body:", req.body); 
};

export { listFood, addFood, removeFood, updateFood };
