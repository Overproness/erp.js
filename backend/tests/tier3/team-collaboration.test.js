/**
 * TIER 3 TEST SUITE: Team Collaboration & Communication
 *
 * Tests team-based features including user roles, permissions,
 * task assignments, notifications, and collaborative workflows.
 *
 * Coverage Areas:
 * - Team management and structure
 * - Role-based access control (RBAC)
 * - Task assignment and delegation
 * - Collaborative document editing
 * - Real-time notifications
 * - Team activity tracking
 * - Permission inheritance
 * - Cross-team collaboration
 */

const mongoose = require('mongoose');
const {
  createTestUser,
  createTestCompany,
  generateJWT,
  cleanupDatabase,
  mockRequest,
  mockResponse,
} = require('../setup/testUtilities');

// Import models
const Team = require('../../src/models/appModels/Team');
const User = require('../../src/models/appModels/User');
const Task = require('../../src/models/appModels/Task');
const Document = require('../../src/models/appModels/Document');
const Client = require('../../src/models/appModels/Client');
const Invoice = require('../../src/models/appModels/Invoice');

// Import controllers and services
const teamController = require('../../src/controllers/appControllers/teamController');
const taskController = require('../../src/controllers/appControllers/taskController');

describe('Team Collaboration & Communication', () => {
  let testCompany, adminUser, managerUser, memberUser1, memberUser2, externalUser;
  let externalCompany;
  let salesTeam, supportTeam, developmentTeam;
  let testClient, testDocument, testTask;

  beforeEach(async () => {
    await cleanupDatabase();

    // Create test company
    testCompany = await createTestCompany();

    // Create external company for permission testing
    externalCompany = await createTestCompany();

    // Create admin user first
    adminUser = await createTestUser(testCompany._id, {
      role: 'admin',
      permissions: ['manage_teams', 'manage_users', 'view_all', 'edit_all'],
    });

    // Create a basic team first
    salesTeam = await Team.create({
      name: 'Sales Team',
      description: 'Handles sales operations',
      owner: testCompany._id,
    });

    // Now create users with team reference
    managerUser = await User.create({
      name: 'Manager User',
      email: 'manager@test.com',
      password: 'password123',
      role: 'lead',
      team: salesTeam._id,
      companyOwner: testCompany._id,
      invitedBy: testCompany._id,
    });

    memberUser1 = await User.create({
      name: 'Member One',
      email: 'member1@test.com',
      password: 'password123',
      role: 'member',
      team: salesTeam._id,
      companyOwner: testCompany._id,
      invitedBy: testCompany._id,
    });

    memberUser2 = await User.create({
      name: 'Member Two',
      email: 'member2@test.com',
      password: 'password123',
      role: 'member',
      team: salesTeam._id,
      companyOwner: testCompany._id,
      invitedBy: testCompany._id,
    });

    // Create external user from different company for permission testing
    externalUser = await User.create({
      name: 'External User',
      email: 'external@test.com',
      password: 'password123',
      role: 'member',
      companyOwner: externalCompany._id,
      invitedBy: externalCompany._id,
    });

    // Update teams with member details
    salesTeam = await Team.findByIdAndUpdate(
      salesTeam._id,
      {
        members: [
          { user: managerUser._id, role: 'lead', joinedAt: new Date() },
          { user: memberUser1._id, role: 'member', joinedAt: new Date() },
        ],
        permissions: {
          view: ['client', 'quote', 'invoice'],
          edit: ['client', 'quote'],
          create: ['client', 'quote'],
          delete: ['quote'],
        },
        settings: {
          allowCrossTeamCollaboration: true,
          requireApprovalForTasks: false,
          autoAssignTasks: true,
        },
      },
      { new: true }
    );

    supportTeam = await Team.create({
      name: 'Support Team',
      description: 'Customer support operations',
      owner: testCompany._id,
      createdBy: adminUser._id,
      members: [{ user: memberUser2._id, role: 'member', joinedAt: new Date() }],
      permissions: {
        view: ['client', 'task', 'document'],
        edit: ['task', 'document'],
        create: ['task', 'document'],
        delete: [],
      },
      settings: {
        allowCrossTeamCollaboration: true,
        requireApprovalForTasks: true,
        autoAssignTasks: false,
      },
    });

    developmentTeam = await Team.create({
      name: 'Development Team',
      description: 'Product development',
      owner: testCompany._id,
      createdBy: adminUser._id,
      members: [],
      permissions: {
        view: ['task', 'document'],
        edit: ['task', 'document'],
        create: ['task', 'document'],
        delete: ['task', 'document'],
      },
      settings: {
        allowCrossTeamCollaboration: false,
        requireApprovalForTasks: true,
        autoAssignTasks: true,
      },
    });

    // Create test entities
    testClient = await Client.create({
      name: 'Team Test Client',
      email: 'teamclient@test.com',
      phone: '+1234567890',
      owner: testCompany._id,
      createdBy: memberUser1._id,
      assignedTeam: salesTeam._id,
    });

    testDocument = await Document.create({
      title: 'Team Document',
      description: 'Shared document content',
      documentType: 'proposal',
      fileName: 'team-document.pdf',
      fileType: 'application/pdf',
      filePath: '/uploads/team-document.pdf',
      fileSize: 1024000,
      owner: testCompany._id,
      createdBy: memberUser1._id,
    });

    testTask = await Task.create({
      title: 'Team Task',
      description: 'Task for team collaboration testing',
      priority: 'medium',
      status: 'pending',
      owner: testCompany._id,
      createdBy: managerUser._id,
      assignedTo: memberUser1._id,
      assignedTeam: salesTeam._id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      tags: ['collaboration', 'test'],
    });
  });

  describe('Team Management & Structure', () => {
    test('should create team with proper structure', async () => {
      const req = mockRequest(
        {
          body: {
            name: 'Marketing Team',
            description: 'Digital marketing operations',
            members: [
              { user: memberUser1._id.toString(), role: 'leader' },
              { user: memberUser2._id.toString(), role: 'member' },
            ],
            permissions: {
              view: ['client', 'quote'],
              edit: ['client'],
              create: ['client'],
              delete: [],
            },
          },
        },
        adminUser,
        testCompany
      );

      const res = mockResponse();
      await teamController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            name: 'Marketing Team',
            members: expect.arrayContaining([
              expect.objectContaining({ role: 'leader' }),
              expect.objectContaining({ role: 'member' }),
            ]),
            owner: testCompany._id,
          }),
        })
      );
    });

    test('should add member to team', async () => {
      const req = mockRequest(
        {
          params: { id: salesTeam._id.toString() },
          body: {
            userId: memberUser2._id.toString(),
            role: 'member',
          },
        },
        managerUser,
        testCompany
      );

      const res = mockResponse();
      await teamController.addMember(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const updatedTeam = await Team.findById(salesTeam._id);
      expect(updatedTeam.members).toHaveLength(3);
      expect(updatedTeam.members.some((m) => m.user.equals(memberUser2._id))).toBe(true);
    });

    test('should remove member from team', async () => {
      const req = mockRequest(
        {
          params: {
            id: salesTeam._id.toString(),
            userId: memberUser1._id.toString(),
          },
        },
        managerUser,
        testCompany
      );

      const res = mockResponse();
      await teamController.removeMember(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const updatedTeam = await Team.findById(salesTeam._id);
      expect(updatedTeam.members).toHaveLength(1);
      expect(updatedTeam.members.some((m) => m.user.equals(memberUser1._id))).toBe(false);
    });

    test('should update member role', async () => {
      const req = mockRequest(
        {
          params: {
            id: salesTeam._id.toString(),
            userId: memberUser1._id.toString(),
          },
          body: { role: 'leader' },
        },
        managerUser,
        testCompany
      );

      const res = mockResponse();
      await teamController.updateMemberRole(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const updatedTeam = await Team.findById(salesTeam._id);
      const member = updatedTeam.members.find((m) => m.user.equals(memberUser1._id));
      expect(member.role).toBe('leader');
    });

    test('should get team hierarchy', async () => {
      const req = mockRequest(
        {
          params: { id: salesTeam._id.toString() },
        },
        managerUser,
        testCompany
      );

      const res = mockResponse();
      await teamController.getHierarchy(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            leaders: expect.any(Array),
            members: expect.any(Array),
            totalMembers: expect.any(Number),
          }),
        })
      );
    });
  });

  describe('Role-Based Access Control (RBAC)', () => {
    test('should enforce team-level permissions', async () => {
      // Member1 in sales team should be able to view clients
      const req1 = mockRequest(
        {
          query: { assignedTeam: salesTeam._id.toString() },
        },
        memberUser1,
        testCompany
      );

      const res1 = mockResponse();
      // Simulate client list request
      const clientController = require('../../src/controllers/appControllers/clientController');
      await clientController.list(req1, res1);

      expect(res1.status).toHaveBeenCalledWith(200);

      // Member2 in support team should NOT be able to view clients
      const req2 = mockRequest(
        {
          query: { assignedTeam: salesTeam._id.toString() },
        },
        memberUser2,
        testCompany
      );

      const res2 = mockResponse();
      await clientController.list(req2, res2);

      expect(res2.status).toHaveBeenCalledWith(403);
    });

    test('should allow cross-team collaboration when enabled', async () => {
      // Add member2 to a task from sales team (cross-team collaboration)
      const req = mockRequest(
        {
          params: { id: testTask._id.toString() },
          body: {
            collaborators: [memberUser2._id.toString()],
          },
        },
        managerUser,
        testCompany
      );

      const res = mockResponse();
      await taskController.addCollaborator(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const updatedTask = await Task.findById(testTask._id);
      expect(updatedTask.collaborators).toContainEqual(memberUser2._id);
    });

    test('should block cross-team collaboration when disabled', async () => {
      // Try to add sales team member to development team task
      const devTask = await Task.create({
        title: 'Development Task',
        description: 'Internal development task',
        priority: 'high',
        status: 'pending',
        owner: testCompany._id,
        createdBy: adminUser._id,
        assignedTeam: developmentTeam._id,
      });

      const req = mockRequest(
        {
          params: { id: devTask._id.toString() },
          body: {
            collaborators: [memberUser1._id.toString()],
          },
        },
        managerUser,
        testCompany
      );

      const res = mockResponse();
      await taskController.addCollaborator(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('cross-team collaboration'),
        })
      );
    });

    test('should inherit team permissions for new members', async () => {
      // Add new member to sales team
      const newMember = await User.create({
        username: 'newmember@test.com',
        email: 'newmember@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'Member',
        role: 'member',
        permissions: [], // No explicit permissions
        owner: testCompany._id,
        isActive: true,
      });

      const req = mockRequest(
        {
          params: { id: salesTeam._id.toString() },
          body: {
            userId: newMember._id.toString(),
            role: 'member',
          },
        },
        managerUser,
        testCompany
      );

      const res = mockResponse();
      await teamController.addMember(req, res);

      // New member should inherit team permissions
      const updatedUser = await User.findById(newMember._id);
      const teamPermissions = salesTeam.permissions;

      expect(updatedUser.effectivePermissions).toEqual(
        expect.arrayContaining(['view_client', 'view_quote', 'edit_client'])
      );
    });
  });

  describe('Task Assignment & Delegation', () => {
    test('should assign task to team member', async () => {
      const req = mockRequest(
        {
          body: {
            title: 'Assigned Team Task',
            description: 'Task assigned to specific team member',
            assignedTo: memberUser1._id.toString(),
            assignedTeam: salesTeam._id.toString(),
            priority: 'high',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          },
        },
        managerUser,
        testCompany
      );

      const res = mockResponse();
      await taskController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            assignedTo: memberUser1._id,
            assignedTeam: salesTeam._id,
            status: 'assigned',
          }),
        })
      );
    });

    test('should auto-assign tasks when enabled', async () => {
      // Create task for sales team (auto-assign enabled)
      const req = mockRequest(
        {
          body: {
            title: 'Auto-Assigned Task',
            description: 'Task that should be auto-assigned',
            assignedTeam: salesTeam._id.toString(),
            priority: 'medium',
          },
        },
        managerUser,
        testCompany
      );

      const res = mockResponse();
      await taskController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);

      const createdTask = res.json.mock.calls[0][0].result;
      expect(createdTask.assignedTo).toBeDefined();
      expect([memberUser1._id.toString(), managerUser._id.toString()]).toContain(
        createdTask.assignedTo.toString()
      );
    });

    test('should delegate task to another team member', async () => {
      const req = mockRequest(
        {
          params: { id: testTask._id.toString() },
          body: {
            delegateTo: memberUser2._id.toString(),
            delegationNote: 'Please handle this task',
          },
        },
        memberUser1,
        testCompany
      );

      const res = mockResponse();
      await taskController.delegate(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const updatedTask = await Task.findById(testTask._id);
      expect(updatedTask.assignedTo).toEqual(memberUser2._id);
      expect(updatedTask.delegationHistory).toHaveLength(1);
      expect(updatedTask.delegationHistory[0].from).toEqual(memberUser1._id);
      expect(updatedTask.delegationHistory[0].to).toEqual(memberUser2._id);
    });

    test('should require approval for task assignment when enabled', async () => {
      // Create task for support team (approval required)
      const req = mockRequest(
        {
          body: {
            title: 'Task Requiring Approval',
            description: 'Task that needs approval',
            assignedTeam: supportTeam._id.toString(),
            assignedTo: memberUser2._id.toString(),
            priority: 'high',
          },
        },
        memberUser2,
        testCompany
      );

      const res = mockResponse();
      await taskController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);

      const createdTask = res.json.mock.calls[0][0].result;
      expect(createdTask.status).toBe('pending_approval');
      expect(createdTask.requiresApproval).toBe(true);
    });

    test('should track task workload distribution', async () => {
      // Create multiple tasks for team members
      const tasks = [];
      for (let i = 0; i < 5; i++) {
        const task = await Task.create({
          title: `Task ${i + 1}`,
          description: `Description ${i + 1}`,
          priority: 'medium',
          status: 'assigned',
          owner: testCompany._id,
          createdBy: managerUser._id,
          assignedTo: i < 3 ? memberUser1._id : memberUser2._id,
          assignedTeam: salesTeam._id,
        });
        tasks.push(task);
      }

      const req = mockRequest(
        {
          params: { id: salesTeam._id.toString() },
        },
        managerUser,
        testCompany
      );

      const res = mockResponse();
      await teamController.getWorkloadDistribution(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            totalTasks: expect.any(Number),
            memberWorkloads: expect.arrayContaining([
              expect.objectContaining({
                user: expect.any(Object),
                assignedTasks: expect.any(Number),
                completedTasks: expect.any(Number),
                overdueTasks: expect.any(Number),
              }),
            ]),
          }),
        })
      );
    });
  });

  describe('Collaborative Document Editing', () => {
    test('should add collaborator to document', async () => {
      const documentController = require('../../src/controllers/appControllers/documentController');

      const req = mockRequest(
        {
          params: { id: testDocument._id.toString() },
          body: {
            userId: managerUser._id.toString(),
            role: 'editor',
          },
        },
        memberUser1,
        testCompany
      );

      const res = mockResponse();
      await documentController.addCollaborator(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const updatedDocument = await Document.findById(testDocument._id);
      expect(updatedDocument.collaborators).toHaveLength(1);
      expect(
        updatedDocument.collaborators.some(
          (c) => c.user.equals(managerUser._id) && c.role === 'editor'
        )
      ).toBe(true);
    });

    test('should track document version history', async () => {
      const documentController = require('../../src/controllers/appControllers/documentController');

      const req = mockRequest(
        {
          params: { id: testDocument._id.toString() },
          body: {
            content: 'Updated document content',
            versionNote: 'Added new section',
          },
        },
        memberUser1,
        testCompany
      );

      const res = mockResponse();
      await documentController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const updatedDocument = await Document.findById(testDocument._id);
      expect(updatedDocument.versionHistory).toHaveLength(1);
      expect(updatedDocument.versionHistory[0].modifiedBy).toEqual(memberUser1._id);
      expect(updatedDocument.versionHistory[0].changes.content).toBe('Updated document content');
    });

    test('should enforce document permissions', async () => {
      const documentController = require('../../src/controllers/appControllers/documentController');

      // External user should not be able to edit documents from different company
      const req = mockRequest(
        {
          params: { id: testDocument._id.toString() },
          body: {
            content: 'Unauthorized edit attempt',
          },
        },
        externalUser,
        externalCompany
      ); // externalUser from different company

      const res = mockResponse();
      await documentController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(404); // Should be 404 for ownership protection
    });

    test('should handle concurrent editing conflicts', async () => {
      const documentController = require('../../src/controllers/appControllers/documentController');

      // Simulate concurrent edits
      const edit1 = mockRequest(
        {
          params: { id: testDocument._id.toString() },
          body: {
            content: 'Edit by user 1',
            version: testDocument.version,
          },
        },
        memberUser1,
        testCompany
      );

      const edit2 = mockRequest(
        {
          params: { id: testDocument._id.toString() },
          body: {
            content: 'Edit by user 2',
            version: testDocument.version, // Same version - conflict
          },
        },
        managerUser,
        testCompany
      );

      const res1 = mockResponse();
      const res2 = mockResponse();

      // First edit should succeed
      await documentController.update(edit1, res1);
      expect(res1.status).toHaveBeenCalledWith(200);

      // Second edit should detect conflict
      await documentController.update(edit2, res2);
      expect(res2.status).toHaveBeenCalledWith(409);
      expect(res2.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('conflict'),
          currentVersion: expect.any(Number),
        })
      );
    });
  });

  describe('Real-time Notifications', () => {
    test('should send notification on task assignment', async () => {
      const notificationService = require('../../src/services/notificationService');
      const mockSendNotification = jest.spyOn(notificationService, 'sendNotification');

      const req = mockRequest(
        {
          params: { id: testTask._id.toString() },
          body: {
            assignedTo: memberUser2._id.toString(),
          },
        },
        managerUser,
        testCompany
      );

      const res = mockResponse();
      await taskController.reassign(req, res);

      expect(mockSendNotification).toHaveBeenCalledWith(memberUser2._id.toString(), {
        type: 'task_assigned',
        title: 'Task assigned to you',
        entityType: 'task',
        entityId: testTask._id.toString(),
      });

      mockSendNotification.mockRestore();
    });

    test('should send notification on team mention', async () => {
      const notificationService = require('../../src/services/notificationService');
      const mockSendNotification = jest.spyOn(notificationService, 'sendNotification');

      const req = mockRequest(
        {
          body: {
            title: 'Task with Team Mention',
            description: 'This task mentions @sales-team',
            assignedTeam: salesTeam._id.toString(),
            mentions: [{ type: 'team', id: salesTeam._id.toString() }],
          },
        },
        managerUser,
        testCompany
      );

      const res = mockResponse();
      await taskController.create(req, res);

      // Should notify all team members
      expect(mockSendNotification).toHaveBeenCalledTimes(2); // manager + member1

      mockSendNotification.mockRestore();
    });

    test('should aggregate notifications for team activities', async () => {
      const notificationService = require('../../src/services/notificationService');

      const req = mockRequest(
        {
          params: { userId: memberUser1._id.toString() },
          query: { type: 'team_activities' },
        },
        memberUser1,
        testCompany
      );

      const res = mockResponse();
      await notificationService.getAggregatedNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            teamActivities: expect.any(Array),
            taskUpdates: expect.any(Array),
            documentChanges: expect.any(Array),
          }),
        })
      );
    });
  });

  describe('Team Activity Tracking', () => {
    test('should track team performance metrics', async () => {
      // Complete some tasks to generate metrics
      await Task.findByIdAndUpdate(testTask._id, {
        status: 'completed',
        completedAt: new Date(),
        completedBy: memberUser1._id,
      });

      const req = mockRequest(
        {
          params: { id: salesTeam._id.toString() },
          query: {
            period: 'week',
            metrics: ['tasks', 'performance', 'collaboration'],
          },
        },
        managerUser,
        testCompany
      );

      const res = mockResponse();
      await teamController.getPerformanceMetrics(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            period: 'week',
            tasksCompleted: expect.any(Number),
            averageCompletionTime: expect.any(Number),
            collaborationScore: expect.any(Number),
            memberPerformance: expect.any(Array),
          }),
        })
      );
    });

    test('should track team activity timeline', async () => {
      const req = mockRequest(
        {
          params: { id: salesTeam._id.toString() },
          query: {
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString(),
          },
        },
        managerUser,
        testCompany
      );

      const res = mockResponse();
      await teamController.getActivityTimeline(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            timeline: expect.arrayContaining([
              expect.objectContaining({
                timestamp: expect.any(String),
                activity: expect.any(String),
                user: expect.any(Object),
                entity: expect.any(Object),
              }),
            ]),
          }),
        })
      );
    });

    test('should generate team collaboration report', async () => {
      const req = mockRequest(
        {
          params: { id: salesTeam._id.toString() },
          query: { reportType: 'collaboration' },
        },
        managerUser,
        testCompany
      );

      const res = mockResponse();
      await teamController.generateReport(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            reportType: 'collaboration',
            teamName: salesTeam.name,
            summary: expect.objectContaining({
              totalCollaborations: expect.any(Number),
              crossTeamCollaborations: expect.any(Number),
              documentCollaborations: expect.any(Number),
              taskCollaborations: expect.any(Number),
            }),
            details: expect.any(Array),
          }),
        })
      );
    });
  });

  describe('Cross-Team Collaboration', () => {
    test('should facilitate cross-team project collaboration', async () => {
      // Create project involving multiple teams
      const Project = require('../../src/models/appModels/Project');

      const crossTeamProject = await Project.create({
        name: 'Cross-Team Initiative',
        description: 'Project requiring multiple teams',
        owner: testCompany._id,
        createdBy: adminUser._id,
        teams: [
          { team: salesTeam._id, role: 'lead' },
          { team: supportTeam._id, role: 'contributor' },
        ],
        collaborationType: 'cross_functional',
        settings: {
          sharedResources: true,
          jointMeetings: true,
          unifiedReporting: true,
        },
      });

      const req = mockRequest(
        {
          params: { id: crossTeamProject._id.toString() },
        },
        adminUser,
        testCompany
      );

      const res = mockResponse();
      const projectController = require('../../src/controllers/appControllers/projectController');
      await projectController.read(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            teams: expect.arrayContaining([salesTeam._id.toString(), supportTeam._id.toString()]),
            collaborationType: 'cross_functional',
          }),
        })
      );
    });

    test('should manage shared team resources', async () => {
      // Create shared resource between teams
      const SharedResource = require('../../src/models/appModels/SharedResource');

      const sharedDoc = await SharedResource.create({
        name: 'Shared Team Document',
        type: 'document',
        resourceId: testDocument._id,
        owner: testCompany._id,
        sharedWith: [
          { team: salesTeam._id, permissions: ['read', 'write'] },
          { team: supportTeam._id, permissions: ['read'] },
        ],
        accessPolicy: 'team_based',
      });

      const req = mockRequest(
        {
          params: { id: sharedDoc._id.toString() },
        },
        memberUser2,
        testCompany
      ); // Support team member

      const res = mockResponse();
      const resourceController = require('../../src/controllers/appControllers/sharedResourceController');
      await resourceController.read(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            permissions: expect.arrayContaining(['read']),
          }),
        })
      );
    });

    test('should coordinate team schedules', async () => {
      const Schedule = require('../../src/models/appModels/Schedule');

      const teamMeeting = await Schedule.create({
        title: 'Cross-Team Sync',
        description: 'Weekly sync between sales and support',
        owner: testCompany._id,
        createdBy: managerUser._id,
        attendees: [
          { type: 'team', id: salesTeam._id, required: true },
          { type: 'team', id: supportTeam._id, required: true },
        ],
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        recurrence: 'weekly',
      });

      const req = mockRequest(
        {
          query: { teams: [salesTeam._id.toString(), supportTeam._id.toString()] },
        },
        managerUser,
        testCompany
      );

      const res = mockResponse();
      const scheduleController = require('../../src/controllers/appControllers/scheduleController');
      await scheduleController.getTeamAvailability(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            availability: expect.any(Object),
            conflicts: expect.any(Array),
            suggestedTimes: expect.any(Array),
          }),
        })
      );
    });
  });
});
