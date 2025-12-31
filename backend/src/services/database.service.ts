import { Injectable } from '@nestjs/common';
import { DatabaseRepository } from '../repositories/database.repository';
import { DatabaseRowRepository } from '../repositories/database-row.repository';
import { PageRepository } from '../repositories/page.repository';
import { WorkspaceRepository } from '../repositories/workspace.repository';
import { PermissionService } from './permission.service';
import { CreateDatabaseDto, UpdateDatabaseDto, CreateDatabaseRowDto, UpdateDatabaseRowDto } from '../dto/database.dto';

@Injectable()
export class DatabaseService {
  constructor(
    private databaseRepo: DatabaseRepository,
    private databaseRowRepo: DatabaseRowRepository,
    private pageRepo: PageRepository,
    private workspaceRepo: WorkspaceRepository,
    private permissionService: PermissionService
  ) {}

  async createDatabase(workspaceUuid: string, userId: bigint, dto: CreateDatabaseDto) {
    // Get workspace and verify access
    const workspace = await this.workspaceRepo.findByUuid(workspaceUuid);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    await this.permissionService.requireWorkspaceAccess(userId, workspace.id);

    // Get page and verify it's a database type
    const page = await this.pageRepo.findByUuid(dto.page_id);
    if (!page) {
      throw new Error('Page not found');
    }

    if (page.workspaceId !== workspace.id) {
      throw new Error('Page must be in the same workspace');
    }

    if (page.type !== 'database') {
      throw new Error('Page must be of type database');
    }

    // Check if database already exists for this page
    const existingDatabase = await this.databaseRepo.findByPageId(page.id);
    if (existingDatabase) {
      throw new Error('Database already exists for this page');
    }

    // Create database
    const database = await this.databaseRepo.create({
      pageId: page.id,
      workspaceId: workspace.id,
      title: dto.title || page.title,
      description: dto.description,
      properties: dto.properties || {},
      views: dto.views || [],
      defaultViewId: dto.default_view_id,
    });

    return database;
  }

  async getDatabase(databaseUuid: string, userId: bigint) {
    const database = await this.databaseRepo.findByUuid(databaseUuid);
    if (!database) {
      throw new Error('Database not found');
    }

    // Verify workspace access
    await this.permissionService.requireWorkspaceAccess(userId, database.workspaceId);

    return database;
  }

  async getDatabasesByWorkspace(workspaceUuid: string, userId: bigint) {
    const workspace = await this.workspaceRepo.findByUuid(workspaceUuid);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    await this.permissionService.requireWorkspaceAccess(userId, workspace.id);

    return this.databaseRepo.findByWorkspaceId(workspace.id);
  }

  async updateDatabase(databaseUuid: string, userId: bigint, dto: UpdateDatabaseDto) {
    const database = await this.databaseRepo.findByUuid(databaseUuid);
    if (!database) {
      throw new Error('Database not found');
    }

    await this.permissionService.requireWorkspaceAccess(userId, database.workspaceId);

    return this.databaseRepo.updateByUuid(databaseUuid, {
      title: dto.title,
      description: dto.description,
      properties: dto.properties,
      views: dto.views,
      defaultViewId: dto.default_view_id,
    });
  }

  async deleteDatabase(databaseUuid: string, userId: bigint) {
    const database = await this.databaseRepo.findByUuid(databaseUuid);
    if (!database) {
      throw new Error('Database not found');
    }

    await this.permissionService.requireWorkspaceAccess(userId, database.workspaceId);

    return this.databaseRepo.softDelete(database.id);
  }

  async createRow(databaseUuid: string, userId: bigint, dto: CreateDatabaseRowDto) {
    const database = await this.databaseRepo.findByUuid(databaseUuid);
    if (!database) {
      throw new Error('Database not found');
    }

    await this.permissionService.requireWorkspaceAccess(userId, database.workspaceId);

    // Get page if page_id provided
    let pageId: bigint | undefined;
    if (dto.page_id) {
      const page = await this.pageRepo.findByUuid(dto.page_id);
      if (!page) {
        throw new Error('Page not found');
      }
      if (page.workspaceId !== database.workspaceId) {
        throw new Error('Page must be in the same workspace');
      }
      pageId = page.id;
    }

    // Calculate properties_text for search
    const propertiesText = dto.properties_text || this.extractPropertiesText(dto.properties);

    // Get next position if not provided
    const existingRows = await this.databaseRowRepo.findByDatabaseId(database.id);
    const position = dto.position ?? (existingRows.length > 0 ? Math.max(...existingRows.map(r => r.position)) + 1 : 0);

    // Calculate formula properties if needed
    const processedProperties = await this.processFormulaProperties(database, dto.properties);

    const row = await this.databaseRowRepo.create({
      databaseId: database.id,
      pageId,
      createdById: userId,
      lastEditedById: userId,
      properties: processedProperties,
      propertiesText,
      position,
    });

    return row;
  }

  async getRows(databaseUuid: string, userId: bigint) {
    const database = await this.databaseRepo.findByUuid(databaseUuid);
    if (!database) {
      throw new Error('Database not found');
    }

    await this.permissionService.requireWorkspaceAccess(userId, database.workspaceId);

    return this.databaseRowRepo.findByDatabaseId(database.id);
  }

  async getRow(databaseUuid: string, rowUuid: string, userId: bigint) {
    const database = await this.databaseRepo.findByUuid(databaseUuid);
    if (!database) {
      throw new Error('Database not found');
    }

    await this.permissionService.requireWorkspaceAccess(userId, database.workspaceId);

    const row = await this.databaseRowRepo.findByUuid(rowUuid);
    if (!row) {
      throw new Error('Row not found');
    }

    if (row.databaseId !== database.id) {
      throw new Error('Row does not belong to this database');
    }

    return row;
  }

  async updateRow(databaseUuid: string, rowUuid: string, userId: bigint, dto: UpdateDatabaseRowDto) {
    const database = await this.databaseRepo.findByUuid(databaseUuid);
    if (!database) {
      throw new Error('Database not found');
    }

    await this.permissionService.requireWorkspaceAccess(userId, database.workspaceId);

    const row = await this.databaseRowRepo.findByUuid(rowUuid);
    if (!row) {
      throw new Error('Row not found');
    }

    if (row.databaseId !== database.id) {
      throw new Error('Row does not belong to this database');
    }

    // Calculate properties_text if properties updated
    let propertiesText = dto.properties_text;
    if (dto.properties && !propertiesText) {
      propertiesText = this.extractPropertiesText(dto.properties);
    }

    // Calculate formula properties if needed
    const rowProps = row.properties as Record<string, any> || {};
    const processedProperties = dto.properties
      ? await this.processFormulaProperties(database, { ...rowProps, ...dto.properties })
      : undefined;

    return this.databaseRowRepo.updateByUuid(rowUuid, {
      properties: processedProperties || dto.properties,
      propertiesText,
      position: dto.position,
      lastEditedById: userId,
    });
  }

  async deleteRow(databaseUuid: string, rowUuid: string, userId: bigint) {
    const database = await this.databaseRepo.findByUuid(databaseUuid);
    if (!database) {
      throw new Error('Database not found');
    }

    await this.permissionService.requireWorkspaceAccess(userId, database.workspaceId);

    const row = await this.databaseRowRepo.findByUuid(rowUuid);
    if (!row) {
      throw new Error('Row not found');
    }

    if (row.databaseId !== database.id) {
      throw new Error('Row does not belong to this database');
    }

    return this.databaseRowRepo.softDelete(row.id);
  }

  /**
   * Extract plain text from properties for search indexing
   */
  private extractPropertiesText(properties: Record<string, any>): string {
    const textParts: string[] = [];

    for (const [key, value] of Object.entries(properties)) {
      if (value === null || value === undefined) {
        continue;
      }

      if (typeof value === 'string') {
        textParts.push(value);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        textParts.push(String(value));
      } else if (Array.isArray(value)) {
        textParts.push(value.join(' '));
      } else if (typeof value === 'object') {
        textParts.push(JSON.stringify(value));
      }
    }

    return textParts.join(' ');
  }

  /**
   * Process formula properties - calculate formula values based on database schema
   */
  private async processFormulaProperties(
    database: any,
    properties: Record<string, any>
  ): Promise<Record<string, any>> {
    const processed = { ...properties };
    const dbProperties = database.properties || {};

    // Check each property in database schema
    for (const [propId, propDef] of Object.entries(dbProperties)) {
      const prop = propDef as any;
      if (prop.type === 'formula' && prop.formula) {
        // Calculate formula value
        try {
          const formulaValue = this.calculateFormula(prop.formula, properties, dbProperties);
          processed[propId] = formulaValue;
        } catch (error) {
          // If formula calculation fails, set to null or error
          processed[propId] = null;
        }
      }
    }

    return processed;
  }

  /**
   * Calculate formula value - enhanced implementation
   * Supports arithmetic operations, property references, and basic functions
   * 
   * Formula syntax:
   * - Property references: {propertyId}
   * - Arithmetic: +, -, *, /, %
   * - Functions: SUM(), AVG(), MIN(), MAX(), COUNT()
   * - Constants: numbers, strings (in quotes)
   */
  private calculateFormula(
    formula: string,
    properties: Record<string, any>,
    schema: Record<string, any>
  ): any {
    try {
      // Replace property references with actual values
      let expression = formula.trim();
      
      // Replace property references {propertyId} with their values
      for (const [propId, propDef] of Object.entries(schema)) {
        const prop = propDef as any;
        const value = properties[propId];
        
        if (value !== null && value !== undefined) {
          // Replace {propertyId} with the actual value
          const regex = new RegExp(`\\{${propId}\\}`, 'g');
          if (prop.type === 'number') {
            expression = expression.replace(regex, String(Number(value) || 0));
          } else if (prop.type === 'text' || prop.type === 'title') {
            expression = expression.replace(regex, `"${String(value).replace(/"/g, '\\"')}"`);
          } else if (prop.type === 'checkbox') {
            expression = expression.replace(regex, value ? '1' : '0');
          } else {
            expression = expression.replace(regex, String(value));
          }
        } else {
          // Replace with 0 for numbers, empty string for text
          const regex = new RegExp(`\\{${propId}\\}`, 'g');
          if (prop.type === 'number') {
            expression = expression.replace(regex, '0');
          } else {
            expression = expression.replace(regex, '""');
          }
        }
      }

      // Handle function calls (basic support)
      expression = this.processFormulaFunctions(expression, properties, schema);

      // Evaluate arithmetic expressions safely
      // Only allow numbers, operators, parentheses, and spaces
      if (/^[0-9+\-*/().\s"']+$/.test(expression)) {
        // For numeric expressions, use Function constructor (safer than eval)
        try {
          // Extract numbers and operators
          const numericExpression = expression.replace(/["']/g, '');
          if (/^[0-9+\-*/().\s]+$/.test(numericExpression)) {
            // Use Function constructor for safer evaluation
            const result = new Function('return ' + numericExpression)();
            return typeof result === 'number' && !isNaN(result) ? result : null;
          }
        } catch (e) {
          // If evaluation fails, try to parse as string
          return expression;
        }
      }

      // For string concatenation or other operations
      if (expression.includes('"') || expression.includes("'")) {
        // Handle string operations
        return this.evaluateStringExpression(expression);
      }

      // Return the processed expression if it couldn't be evaluated
      return expression;
    } catch (error) {
      console.error('Formula calculation error:', error);
      return null;
    }
  }

  /**
   * Process formula functions like SUM(), AVG(), etc.
   */
  private processFormulaFunctions(
    expression: string,
    properties: Record<string, any>,
    schema: Record<string, any>
  ): string {
    // SUM({prop1}, {prop2}, ...)
    expression = expression.replace(/SUM\(([^)]+)\)/g, (match, args) => {
      const values = args.split(',').map((arg: string) => {
        const num = parseFloat(arg.trim());
        return isNaN(num) ? 0 : num;
      });
      return String(values.reduce((sum: number, val: number) => sum + val, 0));
    });

    // AVG({prop1}, {prop2}, ...)
    expression = expression.replace(/AVG\(([^)]+)\)/g, (match, args) => {
      const values = args.split(',').map((arg: string) => {
        const num = parseFloat(arg.trim());
        return isNaN(num) ? 0 : num;
      });
      const sum = values.reduce((s: number, val: number) => s + val, 0);
      return values.length > 0 ? String(sum / values.length) : '0';
    });

    // MIN({prop1}, {prop2}, ...)
    expression = expression.replace(/MIN\(([^)]+)\)/g, (match, args) => {
      const values = args.split(',').map((arg: string) => {
        const num = parseFloat(arg.trim());
        return isNaN(num) ? 0 : num;
      });
      return values.length > 0 ? String(Math.min(...values)) : '0';
    });

    // MAX({prop1}, {prop2}, ...)
    expression = expression.replace(/MAX\(([^)]+)\)/g, (match, args) => {
      const values = args.split(',').map((arg: string) => {
        const num = parseFloat(arg.trim());
        return isNaN(num) ? 0 : num;
      });
      return values.length > 0 ? String(Math.max(...values)) : '0';
    });

    // COUNT({prop1}, {prop2}, ...)
    expression = expression.replace(/COUNT\(([^)]+)\)/g, (match, args) => {
      const values = args.split(',').filter((arg: string) => {
        const trimmed = arg.trim();
        return trimmed !== '' && trimmed !== '0' && trimmed !== 'null' && trimmed !== 'undefined';
      });
      return String(values.length);
    });

    return expression;
  }

  /**
   * Evaluate string expressions (concatenation, etc.)
   */
  private evaluateStringExpression(expression: string): string {
    try {
      // Simple string concatenation
      // Remove quotes and concatenate
      const result = expression
        .replace(/"/g, '')
        .replace(/'/g, '')
        .trim();
      return result;
    } catch (error) {
      return expression;
    }
  }
}

