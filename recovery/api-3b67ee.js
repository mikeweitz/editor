import fetch from 'isomorphic-fetch'

export function fetchTeamData (team ) {
  const encodedURI = encodeURI(`http://localhost:3030/api/v1/teams/${team}`)

  return fetch(encodedURI)
    .then((response) => {
      if (response.status >= 400) {
  			throw new Error("Error: Bad response");
  		}
      return response.json()
    })
    .then((team) => team.data)
    .catch((error) => {
      console.warn(error)
      return null
    });
}

export function fetchCarouselData () {
  const encodedURI = encodeURI(`http://localhost:3030/api/v1/slides`)

  return fetch(encodedURI)
    .then((response) => {
      if (response.status >= 400) {
  			throw new Error("Error: Bad response");
  		}
      return response.json()
    })
    .then((carousel) => carousel.data)
    .catch((error) => {
      console.warn(error)
      return null
    });
}

export function testFunc (team, tele) {
  console.log('testFunc', team, tele);
}

export function submitTele (team, tele) {
  if (!team || !tele) {
    return null;
  }
  const encodedURI = encodeURI(`http://localhost:3030/api/v1/join/${team}/${tele}`)
  let body = {
    team: team,
    tele: tele
  }
  console.log('submit data to join api', body);

  return fetch(encodedURI, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    .then((response) => {
      if (response.status >= 400) {
  			throw new Error("Error: Bad response");
  		}
      return response.json()
    })
    .catch((error) => {
      console.warn(error)
      return null
    });
}
