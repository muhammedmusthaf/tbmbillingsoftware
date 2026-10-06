import User from "../models/User.model.js";

// ==========================================
// CREATE WORKER
// ==========================================
export const createWorker = async (req, res) => {
  try {
    const {
      name,
      phone,
      username,
      password,
    } = req.body;

    if (
      !name ||
      !phone ||
      !username ||
      !password
    ) {
      return res.status(400).json({
        message:
          "Name, phone, username and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters",
      });
    }

    // Check duplicate phone / username
    const existingWorker = await User.findOne({
      $or: [
        {
          phone: phone.trim(),
        },
        {
          username:
            username.toLowerCase().trim(),
        },
      ],
    });

    if (existingWorker) {
      return res.status(400).json({
        message:
          "Phone number or username already exists",
      });
    }

    // Password will automatically be hashed
    // by User model pre-save middleware
    const worker = await User.create({
      name: name.trim(),

      phone: phone.trim(),

      username:
        username.toLowerCase().trim(),

      password,

      // IMPORTANT:
      // Never take role from frontend
      role: "worker",
    });

    res.status(201).json({
      message:
        "Worker created successfully",

      worker: {
        _id: worker._id,
        name: worker.name,
        phone: worker.phone,
        username: worker.username,
        role: worker.role,
        isActive: worker.isActive,
        createdAt: worker.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "CREATE WORKER ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// ==========================================
// GET ALL WORKERS
// ==========================================
export const getWorkers = async (req, res) => {
  try {
    const workers = await User.find({
      role: "worker",
    })
      .select("-password")
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      count: workers.length,
      workers,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// ==========================================
// GET SINGLE WORKER
// ==========================================
export const getWorkerById = async (
  req,
  res
) => {
  try {
    const worker = await User.findOne({
      _id: req.params.id,
      role: "worker",
    }).select("-password");

    if (!worker) {
      return res.status(404).json({
        message: "Worker not found",
      });
    }

    res.status(200).json({
      worker,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// ==========================================
// UPDATE WORKER
// ==========================================
export const updateWorker = async (
  req,
  res
) => {
  try {
    const {
      name,
      phone,
      username,
    } = req.body;

    const worker = await User.findOne({
      _id: req.params.id,
      role: "worker",
    });

    if (!worker) {
      return res.status(404).json({
        message: "Worker not found",
      });
    }

    // Check phone duplicate
    if (phone) {
      const phoneExists = await User.findOne({
        phone: phone.trim(),
        _id: {
          $ne: worker._id,
        },
      });

      if (phoneExists) {
        return res.status(400).json({
          message:
            "Phone number already exists",
        });
      }

      worker.phone = phone.trim();
    }

    // Check username duplicate
    if (username) {
      const cleanUsername =
        username.toLowerCase().trim();

      const usernameExists =
        await User.findOne({
          username: cleanUsername,
          _id: {
            $ne: worker._id,
          },
        });

      if (usernameExists) {
        return res.status(400).json({
          message:
            "Username already exists",
        });
      }

      worker.username = cleanUsername;
    }

    if (name) {
      worker.name = name.trim();
    }

    await worker.save();

    res.status(200).json({
      message:
        "Worker updated successfully",

      worker: {
        _id: worker._id,
        name: worker.name,
        phone: worker.phone,
        username: worker.username,
        role: worker.role,
        isActive: worker.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// ==========================================
// ACTIVATE / DEACTIVATE WORKER
// ==========================================
export const changeWorkerStatus = async (
  req,
  res
) => {
  try {
    const worker = await User.findOne({
      _id: req.params.id,
      role: "worker",
    });

    if (!worker) {
      return res.status(404).json({
        message: "Worker not found",
      });
    }

    worker.isActive = !worker.isActive;

    await worker.save();

    res.status(200).json({
      message: worker.isActive
        ? "Worker activated successfully"
        : "Worker deactivated successfully",

      worker: {
        _id: worker._id,
        name: worker.name,
        username: worker.username,
        isActive: worker.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};