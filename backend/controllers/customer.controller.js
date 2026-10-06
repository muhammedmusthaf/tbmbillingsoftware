import Customer from "../models/Customer.model.js";


// ADD CUSTOMER
export const addCustomer = async (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      email,
      gstin,
      notes,
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        message: "Name and phone number are required",
      });
    }

    const existingCustomer = await Customer.findOne({ phone });

    if (existingCustomer) {
      return res.status(400).json({
        message: "Customer with this phone number already exists",
      });
    }

    const customer = await Customer.create({
      name,
      phone,
      address,
      email,
      gstin,
      notes,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "Customer added successfully",
      customer,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// GET ALL CUSTOMERS
export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({
      isActive: true,
    })
      .populate("createdBy", "name username role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: customers.length,
      customers,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// GET SINGLE CUSTOMER
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate("createdBy", "name username role");

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    res.status(200).json({
      customer,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// UPDATE CUSTOMER
export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const {
      name,
      phone,
      address,
      email,
      gstin,
      notes,
    } = req.body;

    // Check if new phone belongs to another customer
    if (phone && phone !== customer.phone) {
      const existingCustomer = await Customer.findOne({
        phone,
        _id: { $ne: customer._id },
      });

      if (existingCustomer) {
        return res.status(400).json({
          message: "Customer with this phone number already exists",
        });
      }
    }

    if (name !== undefined) customer.name = name;
    if (phone !== undefined) customer.phone = phone;
    if (address !== undefined) customer.address = address;
    if (email !== undefined) customer.email = email;
    if (gstin !== undefined) customer.gstin = gstin;
    if (notes !== undefined) customer.notes = notes;

    const updatedCustomer = await customer.save();

    res.status(200).json({
      message: "Customer updated successfully",
      customer: updatedCustomer,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// DEACTIVATE CUSTOMER
export const deactivateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    customer.isActive = false;

    await customer.save();

    res.status(200).json({
      message: "Customer deactivated successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// SEARCH CUSTOMER
export const searchCustomers = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search) {
      return res.status(400).json({
        message: "Search value is required",
      });
    }

    const customers = await Customer.find({
      isActive: true,
      $or: [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          phone: {
            $regex: search,
            $options: "i",
          },
        },
      ],
    }).limit(10);

    res.status(200).json({
      count: customers.length,
      customers,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};