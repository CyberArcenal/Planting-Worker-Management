// electron-app/main/ipc/handlers/systemConfig.js
const { ipcMain } = require("electron");

const path = require("path");
const { logger } = require("../../../utils/logger");
const {
  SystemSetting,
  SettingType,
} = require("../../../entities/systemSettings");
const Session = require("../../../entities/Session");
const {
  farmSessionDefaultSessionId,
} = require("../../../utils/settings/system");
const { AppDataSource } = require("../../db/datasource");

class SystemConfigHandler {
  constructor() {
    this._settingsCache = null;
    this._lastCacheUpdate = null;
    this._CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    this.systemSettingRepository = null;
    this.initializeRepository();
  }

  async initializeRepository() {
    try {
      this.systemSettingRepository = AppDataSource.getRepository(SystemSetting);
      console.log("✅ SystemConfigHandler repository initialized");
    } catch (error) {
      console.error("❌ Failed to initialize repository:", error);
    }
  }

  // ✅ Normalize boolean value to 0/1 for database
  /**
   * @param {{ toString: () => string; } | null | undefined} value
   */
  normalizeBoolean(value) {
    if (value === null || value === undefined) return 0;
    if (typeof value === "boolean") return value ? 1 : 0;
    if (typeof value === "number") return value ? 1 : 0;
    if (typeof value === "string") {
      const str = value.toString().toLowerCase().trim();
      if (str === "true" || str === "1" || str === "yes") return 1;
      if (str === "false" || str === "0" || str === "no") return 0;
    }
    return 0;
  }

  // ✅ Convert database boolean (0/1) to JavaScript boolean
  /**
   * @param {string | number | null | undefined} value
   */
  dbToBoolean(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      return value === "1" || value.toLowerCase() === "true";
    }
    return false;
  }

  /**
   * @param {Electron.IpcMainInvokeEvent} event
   * @param {{ method: any; params: {}; userId?: number; }} payload // MODIFIED: Added userId
   */

  async handleRequest(event, payload) {
    try {
      const method = payload.method;
      const params = payload.params || {};
      const userId = payload.userId || 1; // ADDED: Get userId from payload

      logger.info(`SystemConfigHandler: ${method}`, params);

      switch (method) {
        case "getGroupedConfig":
          return await this.getGroupedConfig();
        case "updateGroupedConfig":
          return await this.updateGroupedConfig(params.configData, userId); // MODIFIED: Pass userId
        case "getSystemInfo":
          return await this.getSystemInfo();
        case "getAllSettings":
          return await this.getAllSettings();
        case "getPublicSettings":
          return await this.getPublicSettings();
        case "getSettingByKey":
          return await this.getSettingByKey(params.key, params.settingType);
        case "createSetting":
          return await this.createSetting(params.settingData, userId); // MODIFIED: Pass userId
        case "updateSetting":
          return await this.updateSetting(
            params.id,

            params.settingData,
            userId,
          ); // MODIFIED: Pass userId
        case "deleteSetting":
          return await this.deleteSetting(params.id, userId); // MODIFIED: Pass userId
        case "getByType":
          return await this.getByType(params.settingType);
        case "getValueByKey":
          return await this.getValueByKey(params.key, params.defaultValue);
        case "setValueByKey":
          return await this.setValueByKey(
            params.key,

            params.value,

            params.options,
            userId, // MODIFIED: Pass userId
          );
        case "bulkUpdate":
          return await this.bulkUpdate(params.settingsData, userId); // MODIFIED: Pass userId
        case "bulkDelete":
          return await this.bulkDelete(params.ids, userId); // MODIFIED: Pass userId
        case "getSettingsStats":
          return await this.getSettingsStats();
        case "getTaxSettings":
          return await this.getTaxSettings();
        case "getEmailSettings":
          return await this.getEmailSettings();
        case "getSystemInfoForFrontend":
          return await this.getSystemInfoForFrontend();
        case "getDefaultSessionData":
          return this.getDefaultSessionData();

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      logger.error("SystemConfigHandler error:", error);
      return {
        status: false,

        message: error.message,
        data: null,
      };
    }
  }

  /**
   * Kunin ang buong default session record (pang-display)
   * @returns {Promise<{status: boolean, message: string, data: any}>}
   */
  async getDefaultSessionData() {
    try {
      const sessionId = await farmSessionDefaultSessionId();

      if (!sessionId || sessionId === 0) {
        return {
          status: false,
          message: "No default session configured. Please set one in Settings.",
          data: null,
        };
      }

      const sessionRepo = AppDataSource.getRepository(Session);
      const session = await sessionRepo.findOne({
        where: { id: sessionId },
      });

      if (!session) {
        return {
          status: false,
          message: `Default session with ID ${sessionId} not found`,
          data: null,
        };
      }

      // Format pang-display
      const displayData = {
        id: session.id,
        seasonType: session.seasonType,
        year: session.year,
        startDate: session.startDate,
        endDate: session.endDate,
        status: session.status,

        notes: session.notes,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      };

      return {
        status: true,
        message: "Default session data retrieved successfully",
        data: displayData,
      };
    } catch (error) {
      logger.error("getDefaultSessionData error:", error);
      return {
        status: false,

        message: `Failed to retrieve default session data: ${error.message}`,
        data: null,
      };
    }
  }

  async getSystemInfoForFrontend() {
    console.log(`🌐 getSystemInfoForFrontend called`);

    try {
      const [publicSettings, systemInfo] = await Promise.all([
        this.getPublicSettings(),
        this.getSystemInfo(),
      ]);

      // Extract only the data properties
      const frontendInfo = {
        system_info: systemInfo.data ? systemInfo.data : {},
        public_settings: publicSettings.data ? publicSettings.data : [],
        cache_timestamp: new Date().toISOString(),
      };

      // Ensure all values are serializable
      const serializedInfo = JSON.parse(JSON.stringify(frontendInfo));

      console.log(`✅ getSystemInfoForFrontend successful`);

      return {
        status: true,
        message: "Frontend system info fetched successfully",
        data: serializedInfo,
      };
    } catch (error) {
      console.error("❌ getSystemInfoForFrontend error:", error);

      logger.error("getSystemInfoForFrontend error:", error);

      // Return a safe, serializable error response
      return {
        status: false,

        message: error?.message || "Failed to fetch system info",
        data: {
          system_info: {},
          public_settings: [],
          cache_timestamp: new Date().toISOString(),
        },
      };
    }
  }
  /**
   * Kunin ang lahat ng system configuration na naka-group by category
   */
  async getGroupedConfig() {
    try {
      if (this._isCacheValid()) {
        return {
          status: true,
          message: "System configuration retrieved from cache",
          data: this._settingsCache,
        };
      }

      if (!this.systemSettingRepository) {
        await this.initializeRepository();
      }

      const settings = await this.systemSettingRepository.find({
        where: { is_deleted: false },
      });

      if (!settings || settings.length === 0) {
        return {
          status: true,
          message: "No system settings found",
          data: {
            settings: [],
            grouped_settings: {},
            system_info: await this._getSystemInfo(),
          },
        };
      }

      // I-group ang settings by type with proper boolean conversion
      const groupedSettings =
        await this._groupSettingsWithBooleanConversion(settings);

      // I-serialize ang settings data with proper boolean conversion
      const serializedSettings =
        await this._serializeSettingsWithBooleanConversion(settings);

      const result = {
        settings: serializedSettings,
        grouped_settings: groupedSettings,
        system_info: await this._getSystemInfo(),
      };

      // I-update ang cache
      this._updateCache(result);

      logger.info("Get system data", result);

      return {
        status: true,
        message: "System configuration retrieved successfully",
        data: result,
      };
    } catch (error) {
      logger.error("getGroupedConfig error:", error);
      return {
        status: false,

        message: `Failed to retrieve system configuration: ${error.message}`,
        data: null,
      };
    }
  }

  /**
   * I-update ang grouped system configuration
   * @param {string} configData
   * @param {number} [userId=1] // ADDED: User ID for audit logging
   */
  async updateGroupedConfig(configData, userId = 1) {
    try {
      console.log("📥 Received configData type:", typeof configData);
      console.log("📥 Received configData:", configData);

      // I-ensure na merong data
      if (!configData) {
        logger.warn("Empty configuration data received");
        return {
          status: false,
          message: "Empty configuration data",
          data: null,
        };
      }

      // Handle kung string ang na-receive
      if (typeof configData === "string") {
        try {
          configData = JSON.parse(configData);
          console.log("✅ Successfully parsed string to object");
        } catch (err) {
          logger.error("Invalid JSON string received", err);
          return {
            status: false,
            message: "Invalid JSON string format",
            data: null,
          };
        }
      }

      // Handle kung object ang na-receive directly mula sa params

      if (typeof configData === "object" && configData.configData) {
        // Ito yung case na galing sa { configData: JSON.stringify(data) }

        if (typeof configData.configData === "string") {
          try {
            configData = JSON.parse(configData.configData);
            console.log("✅ Parsed configData from object property");
          } catch (err) {
            logger.error("Invalid JSON in configData property", err);
            return {
              status: false,
              message: "Invalid JSON in configData property",
              data: null,
            };
          }
        } else {
          configData = configData.configData;
        }
      }

      logger.info("Updating system configuration with data", {
        configDataType: typeof configData,
        configDataKeys: Object.keys(configData),
      });

      // Validate ang final structure
      if (
        !configData ||
        typeof configData !== "object" ||
        Array.isArray(configData)
      ) {
        logger.warn("Invalid final configuration data format", {
          type: typeof configData,
          isArray: Array.isArray(configData),
          configData,
        });
        return {
          status: false,
          message: "Invalid configuration data format after parsing",
          data: null,
        };
      }

      if (Object.keys(configData).length === 0) {
        logger.warn("Empty final configuration data");
        return {
          status: false,
          message: "Empty configuration data after parsing",
          data: null,
        };
      }

      console.log("✅ Final configData to process:", configData);

      // Continue with the rest of the method...
      const updateResult =
        await this._updateGroupedSettingsWithBooleanNormalization(
          configData,
          userId,
        );
      // Clear cache + reload system data
      this._clearCache();
      const systemData = await this.getGroupedConfig();

      logger.info("System configuration updated successfully", {
        updatedCategories: Object.keys(configData),
        updatedSettingsCount: updateResult.updatedSettings.length,
        errorsCount: updateResult.errors.length,
        cacheCleared: true,
      });

      return {
        status: true,
        message: "System configuration updated successfully",
        data: systemData.data,
        details: {
          updated: updateResult.updatedSettings,
          errors: updateResult.errors,
        },
      };
    } catch (error) {
      logger.error("updateGroupedConfig error", error);
      return {
        status: false,

        message: `Failed to update system configuration: ${error.message}`,
        data: null,
      };
    }
  }

  /**
   * Kunin ang system information
   */
  async getSystemInfo() {
    try {
      const systemInfo = await this._getSystemInfo();

      return {
        status: true,
        message: "System information retrieved successfully",
        data: systemInfo,
      };
    } catch (error) {
      logger.error("getSystemInfo error:", error);
      return {
        status: false,

        message: `Failed to retrieve system information: ${error.message}`,
        data: null,
      };
    }
  }

  /**
   * Kunin ang lahat ng system settings
   */
  async getAllSettings() {
    try {
      if (!this.systemSettingRepository) {
        await this.initializeRepository();
      }

      const settings = await this.systemSettingRepository.find({
        where: { is_deleted: false },
      });
      const serializedSettings =
        await this._serializeSettingsWithBooleanConversion(settings);

      return {
        status: true,
        message: "All system settings retrieved successfully",
        data: serializedSettings,
      };
    } catch (error) {
      logger.error("getAllSettings error:", error);
      return {
        status: false,

        message: `Failed to retrieve system settings: ${error.message}`,
        data: null,
      };
    }
  }

  /**
   * Kunin ang public settings lang
   */
  async getPublicSettings() {
    try {
      if (!this.systemSettingRepository) {
        await this.initializeRepository();
      }

      const settings = await this.systemSettingRepository.find({
        where: { is_public: true, is_deleted: false },
      });
      const serializedSettings =
        await this._serializeSettingsWithBooleanConversion(settings);

      return {
        status: true,
        message: "Public system settings retrieved successfully",
        data: serializedSettings,
      };
    } catch (error) {
      logger.error("getPublicSettings error:", error);
      return {
        status: false,

        message: `Failed to retrieve public settings: ${error.message}`,
        data: null,
      };
    }
  }

  /**
   * Kunin ang specific setting by key at type
   * @param {any} key
   */
  async getSettingByKey(key, settingType = null) {
    try {
      if (!key) {
        return {
          status: false,
          message: "Setting key is required",
          data: null,
        };
      }

      if (!this.systemSettingRepository) {
        await this.initializeRepository();
      }

      const whereClause = { key, is_deleted: false };
      if (settingType) {
        whereClause.setting_type = settingType;
      }

      const setting = await this.systemSettingRepository.findOne({
        where: whereClause,
      });

      if (!setting) {
        return {
          status: true,
          message: "Setting not found",
          data: null,
        };
      }

      const serializedSetting =
        await this._serializeSettingWithBooleanConversion(setting);

      return {
        status: true,
        message: "Setting retrieved successfully",
        data: serializedSetting,
      };
    } catch (error) {
      logger.error("getSettingByKey error:", error);
      return {
        status: false,

        message: `Failed to retrieve setting: ${error.message}`,
        data: null,
      };
    }
  }

  /**
   * Gumawa ng bagong system setting
   * @param {import("typeorm").DeepPartial<import("typeorm").ObjectLiteral>[]} settingData
   * @param {number} [userId=1] // ADDED: User ID for audit logging
   */

  async createSetting(settingData, userId = 1) {
    // MODIFIED: Added userId parameter
    try {
      if (!settingData) {
        return {
          status: false,
          message: "Setting data is required",
          data: null,
        };
      }

      // I-validate ang required fields

      if (!settingData.key || !settingData.setting_type) {
        return {
          status: false,
          message: "Key and setting_type are required",
          data: null,
        };
      }

      if (!this.systemSettingRepository) {
        await this.initializeRepository();
      }

      // Normalize boolean fields

      if (settingData.is_public !== undefined) {
        settingData.is_public =
          this.normalizeBoolean(settingData.is_public) === 1;
      }

      if (settingData.is_deleted !== undefined) {
        settingData.is_deleted =
          this.normalizeBoolean(settingData.is_deleted) === 1;
      }

      const newSetting = this.systemSettingRepository.create(settingData);

      const createdSetting =
        await this.systemSettingRepository.save(newSetting);

      // I-clear ang cache
      this._clearCache();

      const serializedSetting =
        await this._serializeSettingWithBooleanConversion(createdSetting);

      // ADDED: Audit logging
      // await log_audit(
      //   "create",
      //   "SystemSetting",
      //
      //   createdSetting.id,
      //   userId,
      //   {
      //
      //     key: createdSetting.key,
      //
      //     setting_type: createdSetting.setting_type,
      //
      //     value: createdSetting.value,
      //
      //     description: createdSetting.description,
      //
      //     is_public: this.dbToBoolean(createdSetting.is_public),
      //     cache_cleared: true
      //   }
      // );

      return {
        status: true,
        message: "Setting created successfully",
        data: serializedSetting,
      };
    } catch (error) {
      logger.error("createSetting error:", error);
      return {
        status: false,

        message: `Failed to create setting: ${error.message}`,
        data: null,
      };
    }
  }

  /**
   * I-update ang existing system setting
   * @param {any} id
   * @param {import("typeorm").DeepPartial<import("typeorm").ObjectLiteral>} settingData
   * @param {number} [userId=1] // ADDED: User ID for audit logging
   */

  async updateSetting(id, settingData, userId = 1) {
    // MODIFIED: Added userId parameter
    try {
      if (!id || !settingData) {
        return {
          status: false,
          message: "ID and setting data are required",
          data: null,
        };
      }

      if (!this.systemSettingRepository) {
        await this.initializeRepository();
      }

      // Find existing setting

      const existingSetting = await this.systemSettingRepository.findOne({
        where: { id, is_deleted: false },
      });

      if (!existingSetting) {
        return {
          status: false,
          message: "Setting not found",
          data: null,
        };
      }

      // Record old values for audit log

      const oldValues = {
        key: existingSetting.key,
        value: existingSetting.value,
        setting_type: existingSetting.setting_type,
        description: existingSetting.description,

        is_public: this.dbToBoolean(existingSetting.is_public),
      };

      // Normalize boolean fields
      if (settingData.is_public !== undefined) {
        settingData.is_public =
          this.normalizeBoolean(settingData.is_public) === 1;
      }
      if (settingData.is_deleted !== undefined) {
        settingData.is_deleted =
          this.normalizeBoolean(settingData.is_deleted) === 1;
      }

      // Merge changes

      this.systemSettingRepository.merge(existingSetting, settingData);
      existingSetting.updated_at = new Date();

      const updatedSetting =
        await this.systemSettingRepository.save(existingSetting);

      // I-clear ang cache
      this._clearCache();

      const serializedSetting =
        await this._serializeSettingWithBooleanConversion(updatedSetting);

      // ADDED: Audit logging
      // await log_audit(
      //   "update",
      //   "SystemSetting",
      //   id,
      //   userId,
      //   {
      //     old: oldValues,
      //     new: {
      //       key: updatedSetting.key,
      //       value: updatedSetting.value,
      //       setting_type: updatedSetting.setting_type,
      //       description: updatedSetting.description,
      //
      //       is_public: this.dbToBoolean(updatedSetting.is_public)
      //     },
      //     changes: settingData,
      //     cache_cleared: true
      //   }
      // );

      return {
        status: true,
        message: "Setting updated successfully",
        data: serializedSetting,
      };
    } catch (error) {
      logger.error("updateSetting error:", error);
      return {
        status: false,

        message: `Failed to update setting: ${error.message}`,
        data: null,
      };
    }
  }

  /**
   * I-delete ang system setting (soft delete)
   * @param {any} id
   * @param {number} [userId=1] // ADDED: User ID for audit logging
   */

  async deleteSetting(id, userId = 1) {
    // MODIFIED: Added userId parameter
    try {
      if (!id) {
        return {
          status: false,
          message: "Setting ID is required",
          data: null,
        };
      }

      if (!this.systemSettingRepository) {
        await this.initializeRepository();
      }

      const setting = await this.systemSettingRepository.findOne({
        where: { id, is_deleted: false },
      });

      if (!setting) {
        return {
          status: false,
          message: "Setting not found",
          data: null,
        };
      }

      setting.is_deleted = true;
      setting.updated_at = new Date();

      await this.systemSettingRepository.save(setting);

      // I-clear ang cache
      this._clearCache();

      // ADDED: Audit logging
      // await log_audit(
      //   "delete",
      //   "SystemSetting",
      //   id,
      //   userId,
      //   {
      //     key: setting.key,
      //     setting_type: setting.setting_type,
      //     value: setting.value,
      //
      //     is_public: this.dbToBoolean(setting.is_public),
      //     cache_cleared: true
      //   }
      // );

      return {
        status: true,
        message: "Setting deleted successfully",
        data: null,
      };
    } catch (error) {
      logger.error("deleteSetting error:", error);
      return {
        status: false,

        message: `Failed to delete setting: ${error.message}`,
        data: null,
      };
    }
  }

  /**
   * Kunin ang settings by type
   * @param {any} settingType
   */
  async getByType(settingType) {
    try {
      if (!settingType) {
        return {
          status: false,
          message: "Setting type is required",
          data: null,
        };
      }

      if (!this.systemSettingRepository) {
        await this.initializeRepository();
      }

      const settings = await this.systemSettingRepository.find({
        where: { setting_type: settingType, is_deleted: false },
      });
      const serializedSettings =
        await this._serializeSettingsWithBooleanConversion(settings);

      return {
        status: true,
        message: `Settings of type ${settingType} retrieved successfully`,
        data: serializedSettings,
      };
    } catch (error) {
      logger.error("getByType error:", error);
      return {
        status: false,

        message: `Failed to retrieve settings by type: ${error.message}`,
        data: null,
      };
    }
  }

  /**
   * Kunin ang value by key
   * @param {any} key
   */
  async getValueByKey(key, defaultValue = null) {
    try {
      if (!key) {
        return {
          status: false,
          message: "Key is required",
          data: null,
        };
      }

      const result = await this.getSettingByKey(key);
      if (result.status && result.data) {
        return {
          status: true,
          message: "Value retrieved successfully",
          data: result.data.value,
        };
      }

      return {
        status: true,
        message: "Using default value",
        data: defaultValue,
      };
    } catch (error) {
      logger.error("getValueByKey error:", error);
      return {
        status: false,

        message: `Failed to retrieve value: ${error.message}`,
        data: null,
      };
    }
  }

  /**
   * Set value by key (creates or updates)
   * @param {string} key
   * @param {any} value
   * @param {number} [userId=1] // ADDED: User ID for audit logging
   */

  async setValueByKey(key, value, options = {}, userId = 1) {
    // MODIFIED: Added userId parameter
    try {
      if (!key) {
        return {
          status: false,
          message: "Key is required",
          data: null,
        };
      }

      if (!this.systemSettingRepository) {
        await this.initializeRepository();
      }

      // Normalize boolean fields in options

      if (options.is_public !== undefined) {
        options.is_public = this.normalizeBoolean(options.is_public) === 1;
      }

      // Check if setting exists

      const existing = await this.systemSettingRepository.findOne({
        where: {
          key,

          setting_type: options.setting_type || "general",
          is_deleted: false,
        },
      });

      let setting;

      let action = "update"; // Default action

      if (existing) {
        // Record old value for audit log

        const oldValue = existing.value;

        // Update existing
        existing.value = value;

        if (options.is_public !== undefined) {
          existing.is_public = options.is_public;
        }

        if (options.description !== undefined) {
          existing.description = options.description;
        }
        existing.updated_at = new Date();

        setting = await this.systemSettingRepository.save(existing);

        // ADDED: Audit logging for update
        // await log_audit(
        //   "update",
        //   "SystemSetting",
        //
        //   existing.id,
        //   userId,
        //   {
        //     key: key,
        //     old_value: oldValue,
        //     new_value: value,
        //     setting_type: existing.setting_type,
        //
        //     is_public: this.dbToBoolean(existing.is_public),
        //     cache_cleared: true
        //   }
        // );
      } else {
        // Create new
        action = "create";

        const newSetting = this.systemSettingRepository.create({
          key,
          value,

          setting_type: options.setting_type || "general",

          description:
            options.description || `Auto-generated setting for ${key}`,

          is_public: options.is_public || false,
          is_deleted: false,
        });

        setting = await this.systemSettingRepository.save(newSetting);

        // ADDED: Audit logging for create
        // await log_audit(
        //   "create",
        //   "SystemSetting",
        //
        //   setting.id,
        //   userId,
        //   {
        //     key: key,
        //     value: value,
        //     setting_type: setting.setting_type,
        //     description: setting.description,
        //
        //     is_public: this.dbToBoolean(setting.is_public),
        //     cache_cleared: true
        //   }
        // );
      }

      // I-clear ang cache
      this._clearCache();

      const serializedSetting = setting
        ? await this._serializeSettingWithBooleanConversion(setting)
        : null;

      return {
        status: true,
        message: "Value set successfully",
        data: serializedSetting,
      };
    } catch (error) {
      logger.error("setValueByKey error:", error);
      return {
        status: false,

        message: `Failed to set value: ${error.message}`,
        data: null,
      };
    }
  }

  /**
   * Bulk update multiple settings
   * @param {string | any[]} settingsData
   * @param {number} [userId=1] // ADDED: User ID for audit logging
   */

  async bulkUpdate(settingsData, userId = 1) {
    // MODIFIED: Added userId parameter
    try {
      if (
        !settingsData ||
        !Array.isArray(settingsData) ||
        settingsData.length === 0
      ) {
        return {
          status: false,
          message: "Settings data array is required",
          data: null,
        };
      }

      if (!this.systemSettingRepository) {
        await this.initializeRepository();
      }

      const results = [];
      const auditDetails = {
        settings_updated: [],
        settings_created: [],
        errors: [],
      };

      for (const settingData of settingsData) {
        try {
          // Normalize boolean fields in each setting
          const normalizedSetting = {
            ...settingData,
            is_public:
              settingData.is_public !== undefined
                ? this.normalizeBoolean(settingData.is_public) === 1
                : undefined,
            is_deleted:
              settingData.is_deleted !== undefined
                ? this.normalizeBoolean(settingData.is_deleted) === 1
                : undefined,
          };

          // Check if setting exists by key and type

          const existing = await this.systemSettingRepository.findOne({
            where: {
              key: normalizedSetting.key,
              setting_type: normalizedSetting.setting_type,
              is_deleted: false,
            },
          });

          if (existing) {
            // Record old values for audit log
            const oldValues = {
              value: existing.value,

              is_public: this.dbToBoolean(existing.is_public),
              description: existing.description,
            };

            // Update existing

            this.systemSettingRepository.merge(existing, normalizedSetting);
            existing.updated_at = new Date();

            await this.systemSettingRepository.save(existing);

            results.push({
              success: true,
              id: existing.id,
              action: "updated",
            });

            auditDetails.settings_updated.push({
              id: existing.id,
              key: existing.key,
              setting_type: existing.setting_type,
              old_value: oldValues.value,
              new_value: existing.value,
            });
          } else {
            // Create new

            const newSetting =
              this.systemSettingRepository.create(normalizedSetting);

            const created = await this.systemSettingRepository.save(newSetting);

            results.push({
              success: true,

              id: created.id,
              action: "created",
            });

            auditDetails.settings_created.push({
              id: created.id,

              key: created.key,

              setting_type: created.setting_type,

              value: created.value,
            });
          }
        } catch (error) {
          results.push({
            success: false,
            key: settingData.key,

            error: error.message,
          });

          auditDetails.errors.push({
            key: settingData.key,

            error: error.message,
          });
        }
      }

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      // I-clear ang cache
      this._clearCache();

      // ADDED: Audit logging for bulk operation
      // await log_audit(
      //   "bulk_update",
      //   "SystemSetting",
      //
      //   null, // No specific entity ID for bulk operations
      //   userId,
      //   {
      //     total_settings: settingsData.length,
      //     successful_count: successful,
      //     failed_count: failed,
      //     details: auditDetails,
      //     cache_cleared: true,
      //     timestamp: new Date().toISOString()
      //   }
      // );

      return {
        status: true,
        message: `Bulk update completed: ${successful} successful, ${failed} failed`,
        data: results,
      };
    } catch (error) {
      logger.error("bulkUpdate error:", error);
      return {
        status: false,

        message: `Failed to bulk update settings: ${error.message}`,
        data: null,
      };
    }
  }

  /**
   * Bulk delete settings
   * @param {string | any[]} ids
   * @param {number} [userId=1] // ADDED: User ID for audit logging
   */

  async bulkDelete(ids, userId = 1) {
    // MODIFIED: Added userId parameter
    try {
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return {
          status: false,
          message: "Setting IDs array is required",
          data: null,
        };
      }

      if (!this.systemSettingRepository) {
        await this.initializeRepository();
      }

      const results = [];
      const deletedSettings = [];

      for (const id of ids) {
        try {
          const setting = await this.systemSettingRepository.findOne({
            where: { id, is_deleted: false },
          });

          if (setting) {
            // Record setting info for audit log
            deletedSettings.push({
              id: setting.id,
              key: setting.key,
              setting_type: setting.setting_type,
              value: setting.value,
            });

            setting.is_deleted = true;
            setting.updated_at = new Date();

            await this.systemSettingRepository.save(setting);
            results.push({ success: true, id });
          } else {
            results.push({ success: false, id, error: "Setting not found" });
          }
        } catch (error) {
          results.push({ success: false, id, error: error.message });
        }
      }

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      // I-clear ang cache
      this._clearCache();

      // ADDED: Audit logging for bulk delete
      // await log_audit(
      //   "bulk_delete",
      //   "SystemSetting",
      //
      //   null, // No specific entity ID for bulk operations
      //   userId,
      //   {
      //     total_requested: ids.length,
      //     successful_deletions: successful,
      //     failed_deletions: failed,
      //     deleted_settings: deletedSettings,
      //     cache_cleared: true,
      //     timestamp: new Date().toISOString()
      //   }
      // );

      return {
        status: true,
        message: `Bulk delete completed: ${successful} successful, ${failed} failed`,
        data: results,
      };
    } catch (error) {
      logger.error("bulkDelete error:", error);
      return {
        status: false,

        message: `Failed to bulk delete settings: ${error.message}`,
        data: null,
      };
    }
  }

  /**
   * Kunin ang settings statistics
   */
  async getSettingsStats() {
    try {
      if (!this.systemSettingRepository) {
        await this.initializeRepository();
      }

      const total = await this.systemSettingRepository.count({
        where: { is_deleted: false },
      });

      const byType = await this.systemSettingRepository
        .createQueryBuilder("setting")
        .select("setting.setting_type", "type")
        .addSelect("COUNT(*)", "count")
        .where("setting.is_deleted = :is_deleted", { is_deleted: false })
        .groupBy("setting.setting_type")
        .getRawMany();

      const publicCount = await this.systemSettingRepository.count({
        where: { is_public: true, is_deleted: false },
      });

      const stats = {
        total,
        by_type: byType.reduce((acc, item) => {
          acc[item.type] = parseInt(item.count);
          return acc;
        }, {}),
        public_count: publicCount,
        private_count: total - publicCount,
        timestamp: new Date().toISOString(),
      };

      return {
        status: true,
        message: "Settings statistics retrieved successfully",
        data: stats,
      };
    } catch (error) {
      logger.error("getSettingsStats error:", error);
      return {
        status: false,

        message: `Failed to retrieve settings statistics: ${error.message}`,
        data: null,
      };
    }
  }

  /**
   * Kunin ang tax settings with proper boolean conversion
   */
  async getTaxSettings() {
    try {
      if (!this.systemSettingRepository) {
        await this.initializeRepository();
      }

      const settings = await this.systemSettingRepository.find({
        where: { setting_type: "tax", is_deleted: false },
      });
      const groupedSettings =
        await this._groupSettingsWithBooleanConversion(settings);

      return {
        status: true,
        message: "Tax settings retrieved successfully",

        data: groupedSettings.tax || {},
      };
    } catch (error) {
      logger.error("getTaxSettings error:", error);
      return {
        status: false,

        message: `Failed to retrieve tax settings: ${error.message}`,
        data: null,
      };
    }
  }

  /**
   * Kunin ang email settings with proper boolean conversion
   */
  async getEmailSettings() {
    try {
      if (!this.systemSettingRepository) {
        await this.initializeRepository();
      }

      const settings = await this.systemSettingRepository.find({
        where: { setting_type: "email", is_deleted: false },
      });
      const groupedSettings =
        await this._groupSettingsWithBooleanConversion(settings);

      return {
        status: true,
        message: "Email settings retrieved successfully",

        data: groupedSettings.email || {},
      };
    } catch (error) {
      logger.error("getEmailSettings error:", error);
      return {
        status: false,

        message: `Failed to retrieve email settings: ${error.message}`,
        data: null,
      };
    }
  }

  /**
   * PRIVATE METHODS
   * Group settings with proper boolean conversion
   * @param {any[]} settings
   */
  async _groupSettingsWithBooleanConversion(settings) {
    const grouped = {};

    // List of known boolean settings by type
    const booleanSettings = {
      email: ["use_ssl", "use_tls"],
      tax: ["round_tax_at_subtotal", "prices_include_tax", "enabled"],
      supplier_tax: ["enabled"],
      shipping: ["threshold_activate"],
      inventory: ["requireReason", "allowNegative"],
    };

    // List of known numeric settings by type
    const numericSettings = {
      general: ["cache_timeout"],
      email: ["port"],
      tax: [
        "tax_rate",
        "vat_rate",
        "import_duty_rate",
        "excise_tax_rate",
        "digital_services_tax_rate",
        "tax_flat_amount",
      ],
      supplier_tax: ["rate"],
      inventory: ["reorderLevel", "lowStockThreshold"],
    };

    if (settings && Array.isArray(settings)) {
      settings.forEach((setting) => {
        if (!grouped[setting.setting_type]) {
          grouped[setting.setting_type] = {};
        }

        let value = setting.value;

        // Convert known boolean settings
        if (
          booleanSettings[setting.setting_type] &&
          booleanSettings[setting.setting_type].includes(setting.key)
        ) {
          value = this.dbToBoolean(value);
        }
        // Convert known numeric settings
        else if (
          numericSettings[setting.setting_type] &&
          numericSettings[setting.setting_type].includes(setting.key)
        ) {
          value = parseFloat(value) || 0;
        }

        grouped[setting.setting_type][setting.key] = value;
      });
    }

    return grouped;
  }

  /**
   * Serialize settings with proper boolean conversion
   * @param {import("typeorm").ObjectLiteral[]} settings
   */
  async _serializeSettingsWithBooleanConversion(settings) {
    if (!settings || !Array.isArray(settings)) return [];

    const serialized = [];
    for (const setting of settings) {
      const serializedSetting =
        await this._serializeSettingWithBooleanConversion(setting);
      if (serializedSetting) {
        serialized.push(serializedSetting);
      }
    }
    return serialized;
  }

  /**
   * Serialize single setting with proper boolean conversion
   * @param {import("typeorm").ObjectLiteral | import("typeorm").ObjectLiteral[]} setting
   */
  async _serializeSettingWithBooleanConversion(setting) {
    if (!setting) return null;

    return {
      id: setting.id,

      key: setting.key,

      value: setting.value,

      setting_type: setting.setting_type,

      description: setting.description || "",

      is_public: this.dbToBoolean(setting.is_public),

      is_deleted: this.dbToBoolean(setting.is_deleted),

      created_at: setting.created_at,

      updated_at: setting.updated_at,
    };
  }

  /**
   * I-update ang multiple system settings base sa grouped configuration data with boolean normalization
   * @param {ArrayLike<any> | { [s: string]: any; }} configData
   * @param {number} [userId=1] // ADDED: User ID for audit logging
   */
  async _updateGroupedSettingsWithBooleanNormalization(configData, userId = 1) {
    // MODIFIED: Added userId parameter
    const updatedSettings = [];
    const errors = [];

    for (const [category, settingsDict] of Object.entries(configData)) {
      for (const [key, value] of Object.entries(settingsDict)) {
        if (!key || value === undefined || value === null) {
          errors.push({ category, key, error: "Invalid key/value" });
          continue;
        }

        try {
          // Determine the value to save based on type
          let valueToSave = value;

          // If it's a boolean, convert to string "true"/"false" for storage
          if (typeof value === "boolean") {
            valueToSave = value ? "true" : "false";
          }

          const options = {
            setting_type: category,
            description: `Auto-generated ${category} setting for ${key}`,
            is_public: false,
          };

          // Get existing setting to check if it's being updated

          const existing = await this.systemSettingRepository.findOne({
            where: { key, setting_type: category, is_deleted: false },
          });

          const oldValue = existing ? existing.value : null;

          // MODIFIED: Pass userId to setValueByKey
          const result = await this.setValueByKey(
            key,
            valueToSave,
            options,
            userId,
          );

          if (result.status && result.data) {
            updatedSettings.push({
              id: result.data.id,
              setting_type: category,
              key,
              oldValue,
              newValue: result.data.value,
              created: !existing,
            });
          }

          logger.info("Setting updated", {
            category,
            key,
            oldValue,
            newValue: valueToSave,
            created: !existing,
          });
        } catch (error) {
          logger.error(`Failed to update setting ${category}.${key}`, error);

          errors.push({ category, key, error: error.message });
        }
      }
    }

    return {
      updatedSettings,
      errors,
      summary: {
        totalUpdated: updatedSettings.length,
        categories: [...new Set(updatedSettings.map((s) => s.setting_type))],
      },
    };
  }

  /**
   * Kunin ang system information
   */
  async _getSystemInfo() {
    return {
      version: "1.0.0",
      name: "Electron POS System",
      environment: "production",
      debug_mode: process.env.NODE_ENV === "development",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      current_time: new Date().toISOString(),
      setting_types: Object.values(SettingType),
    };
  }

  /**
   * Cache management methods
   */
  _isCacheValid() {
    if (!this._settingsCache || !this._lastCacheUpdate) {
      return false;
    }
    return Date.now() - this._lastCacheUpdate < this._CACHE_DURATION;
  }

  /**
   * @param {{ settings: { id: any; key: any; value: any; setting_type: any; description: any; is_public: boolean; is_deleted: boolean; created_at: any; updated_at: any; }[]; grouped_settings: {}; system_info: { version: string; name: string; environment: string; debug_mode: boolean; timezone: string; current_time: string; setting_types: any[]; }; }} data
   */
  _updateCache(data) {
    this._settingsCache = data;
    this._lastCacheUpdate = Date.now();
  }

  _clearCache() {
    this._settingsCache = null;
    this._lastCacheUpdate = null;
  }
}

// I-register ang IPC handler
const systemConfigHandler = new SystemConfigHandler();

// I-check kung available ang ipcMain bago i-register ang handler
if (ipcMain) {
  ipcMain.handle("systemConfig", async (event, payload) => {
    return await systemConfigHandler.handleRequest(event, payload);
  });
} else {
  logger.warn("ipcMain is not available - running in non-Electron environment");
}

module.exports = { SystemConfigHandler, systemConfigHandler };
