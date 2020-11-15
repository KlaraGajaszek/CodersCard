import React, { useEffect, useState } from 'react';
import { Box, makeStyles } from '@material-ui/core';
import { graphql } from 'gatsby';
import * as _ from 'lodash';

import { FilterTabs, TabsProps } from '../../components/FilterTabs/FilterTabs';
import { Layout } from '../../components/Layout';
import { PortfolioCard } from '../../components/PortfolioCard';
import { PortfolioProjectDialog } from '../../components/PortfolioProject';
import { SectionTitle } from '../../components/SectionTitle';
import { useDeveloperProfile } from '../../containers/DeveloperProfile';
import { useComponentType } from '../../hooks/useComponentType';
import { FC } from '../../typings/components';
import { formatDate } from '../../utils/date';
import { ProjectGQL, ProjectType } from '../../views/portfolio-page/types';

const useStyles = makeStyles((theme) => ({
  titleBox: {
    [theme.breakpoints.up('sm')]: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      position: 'relative',
    },
  },
  projectsContainer: {
    borderRadius: 16,
    padding: theme.spacing(3),

    [theme.breakpoints.up('lg')]: {
      width: '100%',
      padding: theme.spacing(4),
    },
  },
  projects: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gridRowGap: theme.spacing(4),

    [theme.breakpoints.up('sm')]: {
      gridRowGap: theme.spacing(3),
    },

    [theme.breakpoints.up('lg')]: {
      gridTemplateColumns: '400px 400px',
      alignItems: 'center',
      justifyContent: 'center',
      gridGap: theme.spacing(5),
    },
  },
  project: {
    [theme.breakpoints.up('lg')]: {
      width: 400,
      height: 224,
    },
  },
  title: {
    marginBottom: theme.spacing(4),
    width: '100%',
    zIndex: 1,

    [theme.breakpoints.up('sm')]: {
      position: 'absolute',
      marginBottom: theme.spacing(3),
    },

    [theme.breakpoints.up('lg')]: {
      position: 'absolute',
      margin: theme.spacing(0, 2, 4, 2),
    },
  },
  navbarTitles: {
    position: 'relative',
    zIndex: 2,
    margin: theme.spacing(-1.2, 2, 4, 2),
  },
}));

const PortfolioPage: FC<{ data: ProjectGQL }> = ({ data }) => {
  const classes = useStyles();
  const defaultType = 'All';
  const extraType = 'Other';
  const numberOfMaxLabels = 1;
  const projectData = data.portfolioPage.frontmatter;
  const { projects } = projectData;
  const { componentType, isMobile } = useComponentType();
  const developerProfile = useDeveloperProfile();
  const [selectedProject, setSelectedProject] = useState(-1);
  const [navbarTitle, setNavbarTitle] = useState(0);
  const projectsLabels: string[] = [defaultType, ...new Set(projects.map((project) => project.projectLabel))];
  const [projectsUpdated, setProjectUpdated] = useState(projects);
  const [labelsUpdated, setLabelsUpdated] = useState(projectsLabels);

  const getNavbarTitle = (type: number) => {
    const title: Record<number, string> = { ...labelsUpdated };
    return title[type];
  };

  const projectType = getNavbarTitle(navbarTitle);

  // filter all project depending on their label
  const filteredProjects = projectsUpdated.filter((project) => {
    return projectType !== defaultType ? project.projectLabel === projectType : ' ';
  });

  if (labelsUpdated.length - 1 > numberOfMaxLabels) {
    const groupedProjects: Record<string, ProjectType[]> = _.groupBy(projects, 'projectLabel');
    const labelsToDelete: Array<string> = [];

    // orderby number of projects
    const sortedProjectsCollection = Object.entries(groupedProjects)
      // .map((projectArray) => projectArray.splice(1, 2))
      .map((project) => [project, ...project[1]])
      .sort((currentProjects, nextProjects) => {
        return nextProjects.length - currentProjects.length;
      }) as ProjectType[][];
    console.log(sortedProjectsCollection);
    // delete first element-label from array
    sortedProjectsCollection.map((arrayProject) => arrayProject.shift());

    // update labels to other categories
    const updateProjects: Array<Array<ProjectType>> = sortedProjectsCollection.map((projectCollections, index) =>
      index > numberOfMaxLabels - 1
        ? projectCollections.map(
            (project) => (
              labelsToDelete.push(project.projectLabel),
              {
                ...project,
                projectLabel: extraType,
              }
            ),
          )
        : projectCollections,
    );
    // update state with projects
    const mergedProjects: Array<ProjectType> = updateProjects.flat(1);
    const currentLabels = labelsUpdated.filter((label) => !labelsToDelete.includes(label));
    useEffect(() => {
      setLabelsUpdated([...currentLabels, extraType]);
      setProjectUpdated(mergedProjects);
    }, []);
  }

  const handleChange: TabsProps['onChange'] = (event, newValue) => {
    setNavbarTitle(newValue);
  };

  // no project will have index equal to -1 therefore no project will be selected
  const handleCloseProject = () => {
    setSelectedProject(-1);
  };

  // if is first project, choose last project
  const handlePreviousProject = (index: number) => {
    setSelectedProject(index === 0 ? projectData.projects.length - 1 : index - 1);
  };

  // if is last project, choose first project
  const handleNextProject = (index: number) => {
    setSelectedProject(index === projectData.projects.length - 1 ? 0 : index + 1);
  };

  const renderProject = (project: ProjectType, index: number) => (
    <Box key={`${project.projectName}-${project.projectDescription}`}>
      <PortfolioCard
        className={classes.project}
        type={componentType}
        title={project.projectName}
        label={project.projectLabel}
        description={project.projectDescription}
        image={project.projectPreviewImage.publicURL}
        onClick={() => setSelectedProject(index)}
      />
      <PortfolioProjectDialog
        type={componentType}
        handleClose={() => handleCloseProject()}
        handlePrev={() => handlePreviousProject(index)}
        handleNext={() => handleNextProject(index)}
        isOpen={index === selectedProject}
        title={project.projectName}
        tags={project.projectTechnologies.map((technology) => ({ name: technology.technologyName }))}
        imgurl={project.projectPreviewImage.publicURL}
        subtitle={`${formatDate(project.projectStartDate, 'day')} - ${formatDate(
          project.projectFinishDate,
          'day',
          true,
        )}`}
        contentMainDescription={project.projectDescription}
        contentMainRole={project.projectRole}
        contentHeader={project.projectPreviewNote}
        tagtitle={project.projectLabel}
        mockupsUrl={project.projectMockups ?? ''}
        projectUrl={project.projectApp ?? ''}
        codeUrl={project.projectCode ?? ''}
      />
    </Box>
  );

  return (
    <Layout
      developerProfile={developerProfile}
      meta={{
        title: projectData.portfolioPageTitle,
        description: projectData.portfolioPageDescription,
        imageUrl: projectData.portfolioPageImage.publicURL,
      }}
    >
      <Box className={classes.projectsContainer}>
        <Box className={classes.titleBox}>
          <SectionTitle className={classes.title}>My works</SectionTitle>
          {!isMobile && (
            <FilterTabs
              className={classes.navbarTitles}
              indicatorColor="primary"
              textColor="primary"
              handleChange={handleChange}
              navbarTitle={navbarTitle}
              projectLabels={labelsUpdated}
            />
          )}
        </Box>
        <Box className={classes.projects}>{filteredProjects.map(renderProject)}</Box>
      </Box>
    </Layout>
  );
};

export default PortfolioPage;

export const pageQuery = graphql`
  query IndexPageQuery {
    portfolioPage: markdownRemark(fileAbsolutePath: { regex: "/portfolio/index-1.md/" }) {
      frontmatter {
        portfolioPageTitle
        portfolioPageDescription
        portfolioPageImage {
          publicURL
        }
        projects {
          projectLabel
          projectCode
          projectDescription
          projectRole
          projectPreviewNote
          projectApp
          projectStartDate
          projectFinishDate
          projectMockups
          projectPreviewImage {
            publicURL
          }
          projectTechnologies {
            technologyName
          }
          projectName
        }
      }
    }
  }
`;
